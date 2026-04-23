/* =========================================================
   script.js — единая архитектура автозаполнения (PDF + DEMO)
   ========================================================= */

// ===========================
// 0) Состояние
// ===========================
const CTX = {
  agreement: null,
  invoice: null,
  packingList: null,
  cmr: null,
  docs44: new Set(),
};

const LOAD = {
  pending: 0,
  scheduled: false,
};

let tnvedPollInterval = null;

function beginBatch() {
  LOAD.pending++;
  refreshDashboardUI();
}

function endBatch() {
  LOAD.pending = Math.max(0, LOAD.pending - 1);
  refreshDashboardUI();

  if (LOAD.pending === 0 && !LOAD.scheduled) {
    LOAD.scheduled = true;
    setTimeout(() => {
      LOAD.scheduled = false;
      autofillAll();
      refreshDashboardUI();
      showNotification("✅ Все документы обработаны — поля заполнены", "success");
    }, 0);
  }
}

// ===========================
// 1) DOM + helpers
// ===========================
function $(id) {
  return document.getElementById(id);
}

function getDomRefs() {
  return {
    fileInput: $("fileInput"),
    uploadArea: $("uploadArea"),
    fileList: $("fileList"),
    uploadSummary: $("uploadSummary"),
    documentBadges: $("documentBadges"),
    comparisonState: $("comparisonState"),
    comparisonTableBody: $("comparisonTableBody"),
    uploadTrigger: $("uploadTrigger") || document.querySelector(".upload-cta"),
    floatingStepper: $("floatingStepper"),
    tnvedBtn: $("getTnvedBtn"),
    tnvedResult: $("tnvedResult"),
  };
}

const DOM = getDomRefs();

const APP_BASE_PATH = (() => {
  if (typeof window.APP_BASE_PATH === "string") {
    return window.APP_BASE_PATH.replace(/\/$/, "");
  }

  const path = window.location.pathname || "/";
  if (path === "/aideclarant" || path.startsWith("/aideclarant/")) {
    return "/aideclarant";
  }

  return "";
})();

function appUrl(path) {
  if (typeof window.appUrl === "function" && window.appUrl !== appUrl) {
    return window.appUrl(path);
  }

  if (!path) return APP_BASE_PATH || "/";
  return `${APP_BASE_PATH}${path}`;
}

function norm(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function isEmpty(v) {
  return !norm(v);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isInputEl(el) {
  if (!el) return false;
  const t = el.tagName;
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
}

function isEditableEl(el) {
  return !!el && el.getAttribute && el.getAttribute("contenteditable") === "true";
}

function getFieldContent(el) {
  if (!el) return "";
  return isInputEl(el) ? norm(el.value) : norm(el.textContent);
}

function setUnfilledState(el, isUnfilled) {
  if (!el) return;
  el.classList.toggle("unfilled-field", isUnfilled);

  const fieldBox = el.closest(".field");
  if (fieldBox) fieldBox.classList.toggle("field-unfilled", isUnfilled);
}

function isFieldUnfilled(el) {
  const value = getFieldContent(el);
  if (!value) return true;

  if (isEditableEl(el)) {
    const initialValue = norm(el.dataset.initialValue);
    if (initialValue && value === initialValue) return true;
  }

  return false;
}

function initUnfilledTracking() {
  document.querySelectorAll(".field-input, [contenteditable='true']").forEach((el) => {
    if (el.dataset.unfilledReady === "1") return;

    if (isEditableEl(el)) {
      el.dataset.initialValue = getFieldContent(el);
    }

    const sync = () => setUnfilledState(el, isFieldUnfilled(el));
    el.addEventListener("input", sync);
    el.addEventListener("change", sync);
    el.dataset.unfilledReady = "1";
  });
}

function refreshUnfilledHighlights() {
  initUnfilledTracking();
  document.querySelectorAll(".field-input, [contenteditable='true']").forEach((el) => {
    setUnfilledState(el, isFieldUnfilled(el));
  });
}

function clearUnfilledHighlights() {
  document.querySelectorAll(".unfilled-field").forEach((el) => el.classList.remove("unfilled-field"));
  document.querySelectorAll(".field-unfilled").forEach((el) => el.classList.remove("field-unfilled"));
}

function setField(id, value, { force = false } = {}) {
  const el = $(id);
  if (!el) return;

  const v = norm(value);
  if (!v) return;

  const current = isInputEl(el) ? norm(el.value) : norm(el.textContent);
  if (!force && current) return;

  if (isInputEl(el)) el.value = v;
  else el.textContent = v;

  el.classList.add("auto-filled");
  setTimeout(() => el.classList.remove("auto-filled"), 1200);
}

function setEditable(id, value, { force = false } = {}) {
  const el = $(id);
  if (!el) return;

  const v = norm(value);
  if (!v) return;

  const cur = norm(el.textContent);
  const isPlaceholder =
    cur.startsWith("Здесь можно") ||
    cur.startsWith("Дополнительная информация") ||
    cur.startsWith("Информация о декларанте") ||
    cur.startsWith("Отметки таможенных органов") ||
    cur.startsWith("Решение таможенного органа");

  if (!force && cur && !isPlaceholder) return;

  el.textContent = v;
  el.classList.add("auto-filled");
  setTimeout(() => el.classList.remove("auto-filled"), 1200);
}

function addDoc44(line) {
  const s = norm(line);
  if (!s) return;
  CTX.docs44.add(s);
}

function flushDoc44() {
  const lines = Array.from(CTX.docs44);
  if (!lines.length) return;
  setEditable("additionalInfo", lines.join("\n"), { force: true });
}

// ===========================
// 2) Upload + Comparison UI
// ===========================
const DOC_CONFIG = [
  { key: "agreement", label: "Договор" },
  { key: "invoice", label: "Инвойс" },
  { key: "packingList", label: "Packing List" },
  { key: "cmr", label: "CMR" },
];

function getDocStatus(key) {
  if (CTX[key]) return "ready";
  if (LOAD.pending > 0) return "processing";
  return "pending";
}

function getUploadMetrics() {
  const items = Array.from(document.querySelectorAll("#fileList .file-item"));
  return items.reduce((acc, item) => {
    acc.total++;
    const status = item.dataset.status || "processing";
    if (status === "success") acc.success++;
    else if (status === "error") acc.error++;
    else acc.processing++;
    return acc;
  }, { total: 0, success: 0, error: 0, processing: 0 });
}

function formatComparisonValue(value) {
  if (value === undefined || value === null) return "";

  if (Array.isArray(value)) {
    return value.map(formatComparisonValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return [
      value.name,
      value.address,
      value.number,
      value.date,
      value.code,
      value.place,
    ].map(norm).filter(Boolean).join(" / ");
  }

  return norm(value);
}

function normalizeComparisonValue(value) {
  return formatComparisonValue(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveComparisonStatus(values) {
  const populated = values.filter((entry) => entry.normalized);
  if (!populated.length) return "pending";

  const unique = new Set(populated.map((entry) => entry.normalized));
  if (unique.size === 1 && populated.length === values.length) return "match";
  if (unique.size === 1) return "partial";
  return "mismatch";
}

function comparisonLabel(status) {
  if (status === "match") return "Совпадает";
  if (status === "partial") return "Частично";
  if (status === "mismatch") return "Расхождение";
  return LOAD.pending > 0 ? "Обработка" : "Нет данных";
}

function firstItem(doc) {
  if (!doc) return null;
  if (Array.isArray(doc.items) && doc.items.length) return doc.items[0];
  if (Array.isArray(doc.goods) && doc.goods.length) return doc.goods[0];
  if (Array.isArray(doc.products) && doc.products.length) return doc.products[0];
  return null;
}

function buildComparisonRows() {
  const a = CTX.agreement || {};
  const i = CTX.invoice || {};
  const p = CTX.packingList || {};
  const c = CTX.cmr || {};
  const itemI = firstItem(i) || {};
  const itemP = firstItem(p) || {};
  const itemC = firstItem(c) || {};

  return [
    {
      label: "Продавец / отправитель",
      values: {
        agreement: a.seller?.name,
        invoice: i.seller?.name,
        packingList: p.shipper?.name,
        cmr: c.consignor?.name,
      },
    },
    {
      label: "Покупатель / получатель",
      values: {
        agreement: a.buyer?.name,
        invoice: i.buyer?.name,
        packingList: p.consignee?.name,
        cmr: c.consignee?.name,
      },
    },
    {
      label: "Номер договора / ссылки",
      values: {
        agreement: a.contract_number,
        invoice: i.contract_reference?.number,
        packingList: p.invoice_ref,
        cmr: c.related_documents?.invoice_number || c.related_documents?.contract_number,
      },
    },
    {
      label: "Номер документа",
      values: {
        agreement: a.contract_number,
        invoice: i.invoice_number,
        packingList: p.packing_list_number || p.pl_number,
        cmr: c.cmr_number,
      },
    },
    {
      label: "Incoterms",
      values: {
        agreement: formatComparisonValue(a.incoterms),
        invoice: formatComparisonValue(i.incoterms),
        packingList: p.incoterms,
        cmr: c.incoterms,
      },
    },
    {
      label: "Валюта",
      values: {
        agreement: a.currency?.code || a.currency,
        invoice: i.currency?.code || i.currency,
        packingList: p.currency?.code || p.currency,
        cmr: c.currency?.code || c.currency,
      },
    },
    {
      label: "Сумма / стоимость",
      values: {
        agreement: a.total_amount,
        invoice: i.total_amount,
        packingList: p.total_amount,
        cmr: c.total_amount,
      },
    },
    {
      label: "Количество мест",
      values: {
        agreement: a.total_packages,
        invoice: i.total_packages,
        packingList: p.packages?.total_packages || p.packages_summary?.number_of_packages,
        cmr: c.packages_summary?.number_of_packages,
      },
    },
    {
      label: "Вес брутто",
      values: {
        agreement: a.gross_weight_total_kg,
        invoice: i.gross_weight_total_kg,
        packingList: p.gross_weight_total || p.cargo_summary?.total_gross_weight_kg,
        cmr: c.gross_weight_total_kg,
      },
    },
    {
      label: "Вес нетто",
      values: {
        agreement: a.net_weight_total_kg,
        invoice: i.net_weight_total_kg,
        packingList: p.net_weight_total || p.cargo_summary?.total_net_weight_kg,
        cmr: c.net_weight_total_kg,
      },
    },
    {
      label: "Страна происхождения",
      values: {
        agreement: a.origin_and_manufacturer,
        invoice: itemI.origin_country,
        packingList: itemP.origin_country,
        cmr: itemC.origin_country,
      },
    },
    {
      label: "Описание товара",
      values: {
        agreement: a.subject,
        invoice: itemI.description,
        packingList: itemP.description,
        cmr: itemC.description,
      },
    },
    {
      label: "Маршрут / место доставки",
      values: {
        agreement: a.delivery_terms?.place || a.incoterms?.place,
        invoice: i.delivery_address || i.incoterms?.place,
        packingList: p.delivery_place,
        cmr: c.place_of_delivery,
      },
    },
  ];
}

function renderUploadSummary() {
  const summary = DOM.uploadSummary;
  const badges = DOM.documentBadges;
  if (!summary || !badges) return;

  const metrics = getUploadMetrics();

  summary.innerHTML = `
    <div class="summary-card upload-summary-card">
      <small class="summary-label upload-summary-card__label">Файлов в работе</small>
      <strong class="summary-value upload-summary-card__value">${metrics.total}</strong>
    </div>
    <div class="summary-card upload-summary-card">
      <small class="summary-label upload-summary-card__label">Успешно обработано</small>
      <strong class="summary-value upload-summary-card__value">${metrics.success}</strong>
    </div>
  `;

  badges.innerHTML = DOC_CONFIG.map((doc) => {
    const status = getDocStatus(doc.key);
    const label = status === "ready" ? "готов" : status === "processing" ? "в обработке" : "нет данных";
    return `<span class="document-badge document-badge--${status}" data-status="${status}">${escapeHtml(doc.label)}: ${escapeHtml(label)}</span>`;
  }).join("");
}

function renderComparisonTable() {
  const stateNode = DOM.comparisonState;
  const tbody = DOM.comparisonTableBody;
  if (!stateNode || !tbody) return;

  const docsLoaded = DOC_CONFIG.some((doc) => !!CTX[doc.key]);

  if (!docsLoaded && LOAD.pending === 0) {
    stateNode.innerHTML = `
      <div class="comparison-state-card comparison-state__body">
        <div>
          <div class="comparison-state-card__title comparison-state__title">Нет данных для сверки</div>
          <div class="comparison-state-card__text comparison-state__text">
            Загрузите хотя бы один документ, чтобы таблица показала извлечённые реквизиты и отметила совпадения.
          </div>
        </div>
        <span class="comparison-badge comparison-badge--pending comparison-state__status">Ожидание</span>
      </div>
    `;
    tbody.innerHTML = "";
    return;
  }

  const rows = buildComparisonRows();
  const mismatches = rows.filter((row) => {
    const values = DOC_CONFIG.map((doc) => ({
      normalized: normalizeComparisonValue(row.values[doc.key]),
    }));
    return resolveComparisonStatus(values) === "mismatch";
  }).length;

  if (LOAD.pending > 0) {
    stateNode.innerHTML = `
      <div class="comparison-state-card comparison-state__body">
        <div>
          <div class="comparison-state-card__title comparison-state__title">Документы обрабатываются</div>
          <div class="comparison-state-card__text comparison-state__text">
            Как только ответы от сервиса будут получены, строки сверки обновятся автоматически.
          </div>
        </div>
        <span class="comparison-badge comparison-badge--partial comparison-state__status">В обработке</span>
      </div>
    `;
  } else {
    stateNode.innerHTML = `
      <div class="comparison-state-card comparison-state__body">
        <div>
          <div class="comparison-state-card__title comparison-state__title">Сверка обновлена</div>
          <div class="comparison-state-card__text comparison-state__text">
            ${mismatches > 0
              ? `Найдено ${mismatches} строк(и) с расхождениями. Проверьте их перед отправкой декларации.`
              : "Ключевые реквизиты между доступными документами заполнены без явных конфликтов."}
          </div>
        </div>
        <span class="comparison-badge comparison-badge--${mismatches > 0 ? "mismatch" : "match"} comparison-state__status">
          ${mismatches > 0 ? "Есть расхождения" : "Все стабильно"}
        </span>
      </div>
    `;
  }

  tbody.innerHTML = rows.map((row) => {
    const values = DOC_CONFIG.map((doc) => {
      const raw = row.values[doc.key];
      return {
        key: doc.key,
        formatted: formatComparisonValue(raw),
        normalized: normalizeComparisonValue(raw),
      };
    });

    const status = resolveComparisonStatus(values);
    const cells = values.map((value) => {
      const emptyClass = value.formatted ? "" : " comparison-value--empty";
      return `<td class="comparison-value${emptyClass}" data-status="${status}">${value.formatted ? escapeHtml(value.formatted) : "—"}</td>`;
    }).join("");

    return `
      <tr class="comparison-row comparison-row--${status}">
        <td class="comparison-field">${escapeHtml(row.label)}</td>
        ${cells}
        <td data-status="${status}">
          <span class="comparison-badge comparison-badge--${status}">${escapeHtml(comparisonLabel(status))}</span>
        </td>
      </tr>
    `;
  }).join("");
}

function refreshDashboardUI() {
  renderUploadSummary();
  renderComparisonTable();
}

// ===========================
// 3) Countries / address helpers
// ===========================
function countryToISO2(country) {
  const c = norm(country).toLowerCase();
  if (!c) return "";
  const map = {
    "germany": "DE", "deutschland": "DE", "германия": "DE",
    "russia": "RU", "россия": "RU", "russian federation": "RU",
    "belarus": "BY", "беларусь": "BY",
    "poland": "PL", "польша": "PL",
    "china": "CN", "китай": "CN",
  };
  return map[c] || "";
}

function extractPostalCode(address) {
  const a = norm(address);
  const m = a.match(/\b\d{4,6}\b/);
  return m ? m[0] : "";
}

function extractRegion(address, iso2 = "") {
  const a = norm(address);
  if (!a) return "";

  const parts = a.split(",").map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return "";

  if (iso2 === "RU") {
    const cityPart = parts.find((p) => /(^г\.?\s)|город|москва|санкт|екатеринбург|новосибирск/i.test(p));
    if (cityPart) return cityPart.replace(/^г\.?\s*/i, "");
    return parts[2] ? parts[2].replace(/^г\.?\s*/i, "") : (parts[1] || "");
  }

  if (iso2 === "DE") {
    const pc = extractPostalCode(a);
    const pcCity = parts.find((p) => pc && p.includes(pc));
    if (pcCity) return pcCity.replace(pc, "").trim();
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  }

  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

function fillAddressBlock(prefix, party, { force = true } = {}) {
  if (!party) return;

  const country = party.country;
  const address = party.address || party.legal_address;

  if (country) setField(`${prefix}Country`, country, { force });
  if (address) setField(`${prefix}Address`, address, { force });

  const iso2 = countryToISO2(country);
  const postal = extractPostalCode(address);
  const region = extractRegion(address, iso2);

  if (postal) setField(`${prefix}PostalCode`, postal, { force });
  if (region) setField(`${prefix}Region`, region, { force });

  setField(`${prefix}INN`, party.inn || party.vat_or_tax_id || party.vat_or_reg_number, { force: false });
  setField(`${prefix}OKPO`, party.okpo, { force: false });
}

// ===========================
// 4) Notifications
// ===========================
function showNotification(message, type = "info") {
  const container = $("notifications-container") || (() => {
    const c = document.createElement("div");
    c.id = "notifications-container";
    c.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    `;
    document.body.appendChild(c);

    if (!$("notificationStyles")) {
      const style = document.createElement("style");
      style.id = "notificationStyles";
      style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }
    return c;
  })();

  const bg =
    type === "success" ? "#1f7a47" :
    type === "error" ? "#8d2f3a" :
    "#234b87";

  const n = document.createElement("div");
  n.style.cssText = `
    background: ${bg};
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 13px;
    animation: slideIn 0.3s ease;
    width: 320px;
    max-width: calc(100vw - 40px);
    box-sizing: border-box;
  `;
  n.innerHTML = message;
  container.appendChild(n);

  setTimeout(() => {
    n.style.animation = "slideOut 0.25s ease";
    setTimeout(() => n.remove(), 250);
  }, 3200);
}

// ===========================
// 5) Floating stepper
// ===========================
function initFloatingStepper() {
  const stepper = DOM.floatingStepper;
  if (!stepper) return;

  const items = Array.from(stepper.querySelectorAll(".floating-stepper__item"));
  if (!items.length) return;

  const sections = [
    $("uploadSection"),
    $("comparisonSection"),
    $("declarationSection"),
  ].filter(Boolean);

  function setActiveStep(step) {
    items.forEach((item) => {
      item.classList.toggle("floating-stepper__item--active", item.dataset.step === String(step));
    });
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.dataset.target;
      const target = $(targetId);
      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const sectionId = visible[0].target.id;

      if (sectionId === "uploadSection") setActiveStep(1);
      else if (sectionId === "comparisonSection") setActiveStep(2);
      else if (sectionId === "declarationSection") setActiveStep(3);
    },
    {
      threshold: [0.25, 0.4, 0.6],
      rootMargin: "-15% 0px -35% 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));
}

// ===========================
// 6) Upload UI
// ===========================
function bindUploadUi() {
  const fileInput = DOM.fileInput;
  const uploadArea = DOM.uploadArea;

  if (!fileInput || !uploadArea) return;

  fileInput.hidden = true;

  DOM.uploadTrigger?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.value = "";
    fileInput.click();
  });

  uploadArea.addEventListener("click", (e) => {
    if (e.target.closest(".upload-cta")) return;
    if (e.target.closest("input[type='file']")) return;
    fileInput.value = "";
    fileInput.click();
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove("is-dragover");
    });
  });

  uploadArea.addEventListener("drop", (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    handleFiles(files);
  });

  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = "";
  });

  $("start-demo-button")?.addEventListener("click", startDemoLoading);
}

function getFileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  return ext === "pdf" ? "PDF" : "FILE";
}

function addFileToList(file) {
  const fileList = DOM.fileList;
  if (!fileList) return null;

  const fileItem = document.createElement("div");
  fileItem.className = "file-item aid-upload-item";
  fileItem.dataset.status = "processing";

  const fileSize = file.size ? (file.size / 1024 / 1024).toFixed(2) : "—";
  fileItem.innerHTML = `
    <div class="file-icon">${escapeHtml(getFileIcon(file.name || "DEMO"))}</div>
    <div class="file-name aid-upload-item__name" title="${escapeHtml(file.name || "DEMO")}">${escapeHtml(file.name || "DEMO")}</div>
    <div class="file-status processing aid-upload-item__meta">${escapeHtml(fileSize)} MB</div>
  `;
  fileList.appendChild(fileItem);
  refreshDashboardUI();
  return fileItem;
}

function updateFileStatus(fileItem, text, statusClass) {
  const el = fileItem?.querySelector(".file-status");
  if (!el) return;

  el.textContent = text;
  el.className = `file-status ${statusClass}`;
  if (fileItem) fileItem.dataset.status = statusClass;
  refreshDashboardUI();
}

function detectDocType(filename) {
  const name = (filename || "").toLowerCase();

  const isPL =
    name.includes("packing") ||
    name.includes("pack_list") ||
    name.includes("packing_list") ||
    name.includes("upl") ||
    name.includes("pl_") ||
    name.includes("_pl.");

  const isCMR = name.includes("cmr");

  const isINV =
    name.includes("invoice") ||
    name.includes("inv") ||
    name.includes("счет") ||
    name.includes("инвойс");

  const isAGR =
    name.includes("contract") ||
    name.includes("agreement") ||
    name.includes("договор") ||
    name.includes("контракт");

  if (isPL) return "packing_list";
  if (isCMR) return "cmr";
  if (isINV) return "invoice";
  if (isAGR) return "agreement";

  return "unknown";
}

function handleFiles(files) {
  const list = Array.from(files || []).filter((file) => file && /\.pdf$/i.test(file.name || ""));
  if (!list.length) {
    showNotification("❌ Не удалось получить PDF-файлы для загрузки", "error");
    return;
  }

  for (const file of list) {
    const item = addFileToList(file);
    updateFileStatus(item, "Анализ...", "processing");

    const type = detectDocType(file.name);

    if (type === "agreement") processAgreement(file, item);
    else if (type === "invoice") processInvoice(file, item);
    else if (type === "packing_list") processPackingList(file, item);
    else if (type === "cmr") processCmr(file, item);
    else processAuto(file, item);
  }
}

async function processAuto(file, fileItem) {
  const tries = [
    { label: "Инвойс", request: "/invoice/request", result: "/invoice/result", accept: acceptInvoice },
    { label: "Упаковочный", request: "/packing_list/request", result: "/packing_list/result", accept: acceptPackingList },
    { label: "CMR", request: "/cmr/request", result: "/cmr/result", accept: acceptCmr },
    { label: "Договор", request: "/agreement/request", result: "/agreement/result", accept: acceptAgreement },
  ];

  for (const t of tries) {
    try {
      updateFileStatus(fileItem, `Пробуем: ${t.label}...`, "processing");
      const id = await uploadPDF(file, t.request);

      pollResult(id, t.result, (json) => {
        t.accept(json);
        showNotification(`✅ Документ распознан как: ${t.label}`, "success");
      }, fileItem);

      return;
    } catch (e) {
      console.warn(`[AUTO] ${t.label} failed:`, e.message);
    }
  }

  updateFileStatus(fileItem, "✕", "error");
  showNotification("❌ Не удалось определить тип документа. Переименуй файл (invoice/pl/cmr/contract) или добавь ручной выбор типа.", "error");
}

// ===========================
// 7) API: upload + poll + demo
// ===========================
async function extractErrorMessage(response) {
  try {
    const data = await response.json();
    return data?.detail || response.statusText || `HTTP ${response.status}`;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

async function uploadPDF(file, url) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(appUrl(url), { method: "POST", body: formData });
  if (!res.ok) throw new Error(await extractErrorMessage(res));

  const data = await res.json();
  if (!data?.id) throw new Error("Не получен id задачи");
  return data.id;
}

function isDoneStatus(status) {
  if (status === true) return true;

  const s = String(status || "").toLowerCase();
  return s === "done" || s === "success" || s === "completed" || s === "finished";
}

function isErrorStatus(status) {
  const s = String(status || "").toLowerCase();
  return s === "error" || s === "failed";
}

function pollResult(taskId, urlBase, onDone, fileItem) {
  beginBatch();

  const t = setInterval(async () => {
    try {
      const res = await fetch(appUrl(`${urlBase}/${taskId}`));
      if (!res.ok) throw new Error(await extractErrorMessage(res));

      const data = await res.json();
      const st = data?.status;

      if (isErrorStatus(st)) {
        clearInterval(t);
        updateFileStatus(fileItem, "✕", "error");
        showNotification(`❌ Ошибка: ${data?.detail || "Задача завершилась с ошибкой"}`, "error");
        endBatch();
        return;
      }

      if (!isDoneStatus(st)) return;

      clearInterval(t);

      let payload = data.result;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch (_) {}
      }

      updateFileStatus(fileItem, "✓", "success");
      onDone(payload);
      endBatch();
    } catch (e) {
      clearInterval(t);
      updateFileStatus(fileItem, "✕", "error");
      showNotification(`❌ Ошибка: ${e.message}`, "error");
      endBatch();
    }
  }, 900);
}

async function demoLoadDoc(type) {
  try {
    const r1 = await fetch(appUrl(`/demo/request/${type}`), { method: "GET" });
    if (r1.ok) {
      const j1 = await r1.json();
      if (j1?.id) {
        return await new Promise((resolve, reject) => {
          const t = setInterval(async () => {
            try {
              const rr = await fetch(appUrl(`/demo/result/${j1.id}`));
              if (!rr.ok) throw new Error(await extractErrorMessage(rr));
              const dd = await rr.json();
              if (!dd.status) return;

              clearInterval(t);

              let payload = dd.result;
              if (typeof payload === "string") {
                try {
                  payload = JSON.parse(payload);
                } catch (_) {}
              }
              resolve(payload);
            } catch (e) {
              clearInterval(t);
              reject(e);
            }
          }, 700);
        });
      }
    }
  } catch (_) {}

  const r2 = await fetch(appUrl(`/demo/${type}`), { method: "GET" });
  if (!r2.ok) throw new Error(await extractErrorMessage(r2));
  return await r2.json();
}

// ===========================
// 8) Acceptors
// ===========================
function acceptAgreement(json) {
  CTX.agreement = json && !json.error ? json : null;
  if (!CTX.agreement) return;

  const a = CTX.agreement;
  if (a.contract_number) addDoc44(`Договор ${a.contract_number}${a.contract_date ? ` от ${a.contract_date}` : ""}`);
  refreshDashboardUI();
}

function acceptInvoice(json) {
  CTX.invoice = json && !json.error ? json : null;
  if (!CTX.invoice) return;

  const i = CTX.invoice;
  if (i.invoice_number) addDoc44(`Инвойс ${i.invoice_number}${i.invoice_date ? ` от ${i.invoice_date}` : ""}`);
  if (i.contract_reference?.number) {
    addDoc44(`Договор ${i.contract_reference.number}${i.contract_reference.date ? ` от ${i.contract_reference.date}` : ""}`);
  }
  refreshDashboardUI();
}

function acceptPackingList(json) {
  CTX.packingList = json && !json.error ? json : null;
  if (!CTX.packingList) return;

  const p = CTX.packingList;
  if (p.packing_list_number) addDoc44(`Упаковочный лист ${p.packing_list_number}${p.packing_list_date ? ` от ${p.packing_list_date}` : ""}`);
  refreshDashboardUI();
}

function acceptCmr(json) {
  CTX.cmr = json && !json.error ? json : null;
  if (!CTX.cmr) return;

  const c = CTX.cmr;
  if (c.cmr_number) addDoc44(`CMR ${c.cmr_number}${c.cmr_date ? ` от ${c.cmr_date}` : ""}`);

  if (Array.isArray(c.related_documents)) {
    c.related_documents.forEach((d) => {
      if (!d) return;
      let s = norm(d.type);
      if (d.number) s += ` ${d.number}`;
      if (d.date) s += ` от ${d.date}`;
      if (s) addDoc44(s);
    });
  }

  refreshDashboardUI();
}

// ===========================
// 9) Real PDF processors
// ===========================
async function processAgreement(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/agreement/request");
    pollResult(id, "/agreement/result", (json) => {
      acceptAgreement(json);
      showNotification("✅ Договор распознан", "success");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ Договор: ${e.message}`, "error");
  }
}

async function processInvoice(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/invoice/request");
    pollResult(id, "/invoice/result", (json) => {
      acceptInvoice(json);
      showNotification("✅ Инвойс распознан", "success");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ Инвойс: ${e.message}`, "error");
  }
}

async function processPackingList(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/packing_list/request");
    pollResult(id, "/packing_list/result", (json) => {
      acceptPackingList(json);
      showNotification("✅ Упаковочный лист распознан", "success");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ Упаковочный лист: ${e.message}`, "error");
  }
}

async function processCmr(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/cmr/request");
    pollResult(id, "/cmr/result", (json) => {
      acceptCmr(json);
      showNotification("✅ CMR распознан", "success");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ CMR: ${e.message}`, "error");
  }
}

// ===========================
// 10) DEMO
// ===========================
async function startDemoLoading() {
  const startBtn = $("start-demo-button");
  if (startBtn) startBtn.remove();

  refreshDashboardUI();

  try {
    const demoPL = addFileToList({ name: "ДЕМО Упаковочный лист", size: 1 * 1024 * 1024 });
    const demoINV = addFileToList({ name: "ДЕМО Инвойс", size: 1 * 1024 * 1024 });
    const demoCMR = addFileToList({ name: "ДЕМО CMR", size: 1 * 1024 * 1024 });
    const demoAGR = addFileToList({ name: "ДЕМО Договор", size: 1 * 1024 * 1024 });

    updateFileStatus(demoPL, "Загрузка...", "processing");
    updateFileStatus(demoINV, "Загрузка...", "processing");
    updateFileStatus(demoCMR, "Загрузка...", "processing");
    updateFileStatus(demoAGR, "Загрузка...", "processing");

    const [pl, inv, cmr, agr] = await Promise.all([
      demoLoadDoc("pl"),
      demoLoadDoc("invoice"),
      demoLoadDoc("cmr"),
      demoLoadDoc("contract"),
    ]);

    acceptPackingList(pl);
    updateFileStatus(demoPL, "✓", "success");

    acceptInvoice(inv);
    updateFileStatus(demoINV, "✓", "success");

    acceptCmr(cmr);
    updateFileStatus(demoCMR, "✓", "success");

    acceptAgreement(agr);
    updateFileStatus(demoAGR, "✓", "success");

    autofillAll();
    refreshDashboardUI();
    showNotification("✅ Демо-данные загружены и применены", "success");
  } catch (e) {
    refreshDashboardUI();
    showNotification(`❌ DEMO: ${e.message}`, "error");
  }
}

window.startDemoLoading = startDemoLoading;

// ===========================
// 11) Autofill helpers
// ===========================
function pick(...vals) {
  for (const v of vals) {
    if (!isEmpty(v)) return v;
  }
  return "";
}

function parsePackagesString(s) {
  const raw = (s || "").toLowerCase().trim();
  if (!raw) return [];

  const map = [
    { re: /(carton|cartons|короб|коробк)/, code: "CT" },
    { re: /(pallet|pallets|поддон|паллет)/, code: "PX" },
    { re: /(box|boxes|ящик|ящики)/, code: "BX" },
    { re: /(bag|bags|мешок|мешки)/, code: "BG" },
    { re: /(case|cases|кейс|кейсы)/, code: "CS" },
  ];

  const parts = raw.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  const out = [];

  for (const part of parts) {
    const mQty = part.match(/\b(\d+)\b/);
    const qty = mQty ? parseInt(mQty[1], 10) : null;

    let hit = null;
    for (const it of map) {
      if (it.re.test(part)) {
        hit = it;
        break;
      }
    }

    if (qty && hit) out.push({ qty, code: hit.code });
  }

  return out;
}

function sumPackages(list) {
  return list.reduce((acc, x) => acc + (Number(x.qty) || 0), 0);
}

function getPackagingFromCtx(ctx) {
  const p = ctx.packingList || {};
  const c = ctx.cmr || {};

  const totalPlaces =
    p.cargo_summary?.total_packages ??
    p.packages_summary?.number_of_packages ??
    p.packages?.total_packages ??
    c.packages_summary?.number_of_packages ??
    null;

  const kind =
    p.cargo_summary?.kind_of_packages ??
    p.packages_summary?.kind_of_packages ??
    p.packages?.package_type ??
    "";

  const marks =
    p.packages?.marks_and_numbers ??
    p.packages_summary?.marks_and_numbers ??
    "";

  return { totalPlaces, kind, marks };
}

function pickMainItemFromCtx(ctx) {
  const p = ctx.packingList || {};
  const i = ctx.invoice || {};
  const c = ctx.cmr || {};

  const itemP = Array.isArray(p.items) ? p.items[0] : null;
  const itemI = Array.isArray(i.items) ? i.items[0] : null;
  const itemC = Array.isArray(c.items) ? c.items[0] : null;

  return itemP || itemI || itemC || null;
}

function buildGraph31Text(ctx) {
  const a = ctx.agreement || {};
  const i = ctx.invoice || {};
  const c = ctx.cmr || {};
  const item = pickMainItemFromCtx(ctx);

  const desc = (item?.description || item?.name || "").trim();
  const brand = (item?.brand || item?.trademark || "").trim();
  const model = (item?.model || item?.part_number || item?.article || "").trim();
  const manufacturer = (item?.manufacturer || i.seller?.name || a.seller?.name || "").trim();
  const subject = (a.subject || "").trim();

  const line1Parts = [
    desc,
    brand ? `ТМ: ${brand}` : "",
    model ? `Модель/арт.: ${model}` : "",
    manufacturer ? `Производитель: ${manufacturer}` : "",
    subject ? `Тема: ${subject}` : "",
  ].filter(Boolean);

  const line1 = line1Parts.length ? `1- ${line1Parts.join("; ")}` : "";

  const { totalPlaces, kind, marks } = getPackagingFromCtx(ctx);
  const parsed = parsePackagesString(kind);
  const placesFromParsed = parsed.length ? sumPackages(parsed) : null;
  const places = totalPlaces != null ? totalPlaces : placesFromParsed;

  const packCodes = parsed.length
    ? parsed.map((x) => `${x.code}-${x.qty}`).join(", ")
    : (kind ? kind : "");

  const line2 = (places != null || packCodes)
    ? `2- ${[places != null ? String(places) : "", packCodes].filter(Boolean).join(", ")}`
    : "";

  const line21 = marks ? `2.1- Маркировка: ${marks}` : "";

  const veh = c.transport || c.vehicle || {};
  const tractor = (veh.tractor_plate || veh.truck || c.truck || "").trim();
  const trailer = (veh.trailer_plate || veh.trailer || c.trailer || "").trim();
  const vehStr = [tractor && `тягач ${tractor}`, trailer && `прицеп ${trailer}`].filter(Boolean).join(", ");
  const line3 = vehStr ? `3- Транспорт: ${vehStr}` : "";

  return [line1, line2, line21, line3].filter(Boolean).join("\n");
}

function fillGraph31FromCtx(ctx, { force = true } = {}) {
  const text = buildGraph31Text(ctx);
  if (!text) return;
  setEditable("goodsDescription", text, { force });
}

// ===========================
// 12) Autofill
// ===========================
function autofillAll() {
  const a = CTX.agreement || {};
  const i = CTX.invoice || {};
  const p = CTX.packingList || {};
  const c = CTX.cmr || {};

  const sender = p.shipper || c.consignor || a.seller || i.seller || {};
  const receiver = p.consignee || c.consignee || a.buyer || i.buyer || {};

  fillAddressBlock("sender", sender, { force: true });
  fillAddressBlock("receiver", receiver, { force: true });

  const contractNumber = pick(a.contract_number, i.contract_reference?.number);
  const contractDate = pick(a.contract_date, i.contract_reference?.date);
  if (contractNumber) {
    setField(
      "clientContract",
      contractDate ? `${contractNumber} от ${contractDate}` : contractNumber,
      { force: true }
    );
  }

  const curCode = pick(i.currency?.code, a.currency?.code, i.currency, a.currency);
  const totalAmount = (i.total_amount != null) ? i.total_amount : a.total_amount;

  if (curCode || totalAmount != null) {
    setField("currencyTotal", `${norm(curCode)} ${norm(totalAmount)}`.trim(), { force: true });
  }

  if (totalAmount != null) {
    setField("totalCustomsValue", String(totalAmount), { force: true });
  }

  const inc = i.incoterms || a.incoterms;
  if (inc) {
    const incStr =
      typeof inc === "string"
        ? inc
        : [inc.rule, inc.place].filter(Boolean).join(" ") + (inc.version ? `, ${inc.version}` : "");
    if (norm(incStr)) setField("field13", incStr, { force: true });
  }

  setField("paymentDeferral", pick(i.payment_terms, a.payment_terms), { force: true });

  const itemP = firstItem(p);
  const itemI = firstItem(i);

  fillGraph31FromCtx(CTX, { force: true });

  setField("productNumber", "1", { force: false });

  const hs = pick(itemP?.hs_code, itemI?.hs_code, itemP?.tnved, itemI?.tnved);
  if (hs) setField("tnVedCode", hs, { force: false });

  const originCountry = pick(itemP?.origin_country, itemI?.origin_country, a.origin_and_manufacturer, sender.country);
  if (originCountry) {
    let oc = originCountry;
    if (oc.length > 30) {
      const m = oc.match(/(Германия|Россия|Китай|Польша|Беларусь|Germany|Russia|China|Poland|Belarus)/i);
      if (m) oc = m[0];
    }
    setField("originCountry", oc, { force: true });
  }

  const qty = (itemP?.quantity != null) ? itemP.quantity : itemI?.quantity;
  if (qty != null) setField("quantity", String(qty), { force: true });

  const uom = pick(itemP?.unit, itemP?.uom, itemI?.uom);
  if (uom) setField("uom", uom, { force: true });

  if (itemI?.unit_price != null) setField("productPrice", String(itemI.unit_price), { force: true });

  if (c.gross_weight_total_kg != null) setField("grossWeight", String(c.gross_weight_total_kg), { force: true });
  else if (itemP?.gross_weight_kg != null) setField("grossWeight", String(itemP.gross_weight_kg), { force: true });

  if (itemP?.net_weight_kg != null) setField("netWeightProduct", String(itemP.net_weight_kg), { force: true });

  const totalGoods =
    (p.cargo_summary?.total_packages != null) ? p.cargo_summary.total_packages :
    (c.packages_summary?.number_of_packages != null) ? c.packages_summary.number_of_packages :
    (Array.isArray(i.items) ? i.items.length : null);

  if (totalGoods != null) setField("totalGoods", String(totalGoods), { force: true });

  const netTotal =
    (p.cargo_summary?.total_net_weight_kg != null) ? p.cargo_summary.total_net_weight_kg :
    (c.net_weight_total_kg != null) ? c.net_weight_total_kg :
    null;

  if (netTotal != null) setField("netWeight", String(netTotal), { force: true });

  const exportISO =
    (Array.isArray(c.route_countries) && c.route_countries[0]) ? c.route_countries[0] :
    countryToISO2(sender.country);

  if (exportISO) setField("tradeCountry", exportISO, { force: true });

  const originISO = countryToISO2(norm($("originCountry")?.value || ""));
  const destISO =
    (Array.isArray(c.route_countries) && c.route_countries.length) ? c.route_countries[c.route_countries.length - 1] :
    countryToISO2(receiver.country);

  if (exportISO || originISO || destISO) {
    setField("countries", `${exportISO || "?"} / ${originISO || "?"} / ${destISO || "?"}`, { force: true });
  }

  if (CTX.cmr) {
    setField("transportDeparture", "Автомобильный", { force: true });
  }

  const veh = c.vehicle || c.transport || {};
  const truck = pick(veh.truck, c.truck);
  const trailer = pick(veh.trailer, c.trailer);
  const vehStr = [truck ? `Тягач: ${truck}` : "", trailer ? `Прицеп: ${trailer}` : ""].filter(Boolean).join(", ");

  if (vehStr) setField("transportBorder", vehStr, { force: true });
  else if (CTX.cmr) setField("transportBorder", "Автомобильный", { force: true });

  if (i.invoice_number) addDoc44(`Инвойс ${i.invoice_number}${i.invoice_date ? ` от ${i.invoice_date}` : ""}`);
  if (p.packing_list_number) addDoc44(`Упаковочный лист ${p.packing_list_number}${p.packing_list_date ? ` от ${p.packing_list_date}` : ""}`);
  if (a.contract_number) addDoc44(`Договор ${a.contract_number}${a.contract_date ? ` от ${a.contract_date}` : ""}`);
  if (c.cmr_number) addDoc44(`CMR ${c.cmr_number}${c.cmr_date ? ` от ${c.cmr_date}` : ""}`);

  flushDoc44();

  if (totalAmount != null) {
    setField("customsValue", String(totalAmount), { force: false });
    setField("statisticalValue", String(totalAmount), { force: false });
  }

  refreshUnfilledHighlights();
  refreshDashboardUI();
  showNotification("✅ Поля формы обновлены по распознанным документам", "success");
}

// ===========================
// 13) TNVED
// ===========================
function createLoadingBlock(text = "Анализируем описание товаров...") {
  return `
    <div style="color:#666;text-align:center;padding:40px;">
      <div style="font-size:48px;margin-bottom:20px;animation:pulse 1.5s infinite;">🔍</div>
      <p style="font-size:16px;margin-bottom:10px;">${escapeHtml(text)}</p>
      <div style="font-size:14px;color:#999;">
        ИИ анализирует описание и подбирает подходящие коды ТН ВЭД
      </div>
    </div>
    <style>
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    </style>
  `;
}

function createErrorBlock(message) {
  return `
    <div style="color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;border-radius:8px;padding:20px;text-align:center;">
      <div style="font-size:36px;margin-bottom:15px;">❌</div>
      <p style="font-size:16px;margin:0;">${escapeHtml(message)}</p>
    </div>
  `;
}

function clearTnvedResults() {
  if (DOM.tnvedResult) DOM.tnvedResult.innerHTML = "";
  if (tnvedPollInterval) {
    clearInterval(tnvedPollInterval);
    tnvedPollInterval = null;
  }
}

function applyTnvedCode(code) {
  const tnVedCodeField = $("tnVedCode");
  if (tnVedCodeField) {
    tnVedCodeField.value = code;
    tnVedCodeField.classList.add("auto-filled");
    setTimeout(() => tnVedCodeField.classList.remove("auto-filled"), 1200);
    showNotification(`✅ Код <strong>${escapeHtml(code)}</strong> применен в поле "33 ТН ВЭД"`, "success");
  }
}

window.applyTnvedCode = applyTnvedCode;
window.clearTnvedResults = clearTnvedResults;
window.clearResults = clearTnvedResults;

function displayFullTnvedResult(data) {
  const resultDiv = DOM.tnvedResult;
  if (!resultDiv) return;

  if (!data || !data.eaeu_hs_code) {
    resultDiv.innerHTML = createErrorBlock("Не удалось определить код ТНВЭД");
    return;
  }

  const formattedCode = data.eaeu_hs_code.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");

  let html = `
    <div style="max-width:800px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;border-radius:8px;margin-bottom:20px;text-align:center;">
        <div style="font-size:14px;opacity:.9;margin-bottom:5px;">РЕКОМЕНДОВАННЫЙ КОД ТН ВЭД ЕАЭС</div>
        <div style="font-size:36px;font-weight:bold;font-family:'Courier New',monospace;margin:10px 0;">
          ${escapeHtml(formattedCode)}
        </div>
        <div style="font-size:14px;opacity:.9;">
          Уверенность: <strong>${((data.confidence || 0) * 100).toFixed(1)}%</strong>
        </div>
        <button onclick="applyTnvedCode('${escapeHtml(data.eaeu_hs_code)}')"
                style="margin-top:15px;background:white;color:#667eea;border:none;padding:10px 25px;border-radius:25px;font-weight:bold;cursor:pointer;font-size:16px;">
          ✅ Применить этот код
        </button>
      </div>
  `;

  if (Array.isArray(data.explanations) && data.explanations.length) {
    html += `
      <div style="background:white;border-radius:8px;padding:20px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color:#2c3e50;margin-top:0;border-bottom:2px solid #f8f9fa;padding-bottom:10px;">
          📋 Обоснование классификации
        </h3>
        <ol style="padding-left:20px;">
          ${data.explanations.map((exp) => `<li style="margin-bottom:10px;line-height:1.5;">${escapeHtml(exp)}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  if (Array.isArray(data.candidate_codes) && data.candidate_codes.length) {
    html += `
      <div style="background:white;border-radius:8px;padding:20px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="color:#2c3e50;margin-top:0;border-bottom:2px solid #f8f9fa;padding-bottom:10px;">
          ⚠️ Рассмотренные альтернативные коды
        </h3>
        ${data.candidate_codes.map((candidate) => `
          <div style="margin-bottom:15px;padding:15px;background:#f8f9fa;border-radius:6px;border-left:4px solid #ffc107;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong style="font-family:'Courier New',monospace;color:#dc3545;">${escapeHtml(candidate.code || "")}</strong>
              <span style="font-size:12px;color:#6c757d;">не подходит</span>
            </div>
            <div style="font-size:14px;color:#495057;">${escapeHtml(candidate.why_not || "")}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  if ((Array.isArray(data.evidence_urls) && data.evidence_urls.length) || data.notes) {
    html += `<div style="display:grid;gap:20px;margin-bottom:20px;">`;

    if (Array.isArray(data.evidence_urls) && data.evidence_urls.length) {
      html += `
        <div style="background:white;border-radius:8px;padding:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color:#2c3e50;margin-top:0;font-size:16px;">🔗 Источники информации</h3>
          <div style="font-size:13px;">
            ${data.evidence_urls.map((url) => {
              const displayUrl = String(url).replace("https://", "").replace("www.", "").split("/")[0];
              return `
                <a href="${escapeHtml(url)}" target="_blank" style="display:block;padding:8px;margin-bottom:5px;background:#f8f9fa;border-radius:4px;color:#007bff;text-decoration:none;">
                  ${escapeHtml(displayUrl)}
                </a>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    if (data.notes) {
      html += `
        <div style="background:#fff3cd;border:1px solid #ffeaa7;border-radius:8px;padding:20px;">
          <h3 style="color:#856404;margin-top:0;font-size:16px;">📝 Примечания</h3>
          <p style="color:#856404;font-size:14px;line-height:1.5;">${escapeHtml(data.notes)}</p>
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `
      <div class="tnved-action-buttons">
        <button onclick="applyTnvedCode('${escapeHtml(data.eaeu_hs_code)}')" class="tnved-apply-main-btn">
          ✅ Применить код ${escapeHtml(data.eaeu_hs_code)}
        </button>
        <button onclick="clearTnvedResults()" class="tnved-clear-btn">
          🗑️ Очистить результаты
        </button>
      </div>
    </div>
  `;

  resultDiv.innerHTML = html;
}

function startTnvedPolling(taskId) {
  const resultDiv = DOM.tnvedResult;
  if (!resultDiv) return;

  if (tnvedPollInterval) {
    clearInterval(tnvedPollInterval);
    tnvedPollInterval = null;
  }

  resultDiv.innerHTML = createLoadingBlock();

  let attempt = 0;
  tnvedPollInterval = setInterval(async () => {
    attempt++;

    try {
      const response = await fetch(appUrl(`/tnvedcode/result/${taskId}`));
      if (!response.ok) {
        throw new Error(`Ошибка получения статуса: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === true || String(data.status).toLowerCase() === "done" || String(data.status).toLowerCase() === "success") {
        clearInterval(tnvedPollInterval);
        tnvedPollInterval = null;

        let resultData = data.result;
        if (typeof resultData === "string") {
          try {
            resultData = JSON.parse(resultData);
          } catch (_) {}
        }

        displayFullTnvedResult(resultData);
      } else if (data.status === false || String(data.status).toLowerCase() === "processing" || String(data.status).toLowerCase() === "pending") {
        if (attempt % 5 === 0) {
          const dots = ".".repeat((attempt % 3) + 1);
          resultDiv.innerHTML = createLoadingBlock(`Анализируем описание товаров${dots} (${attempt} сек)`);
        }
      } else if (String(data.status).toLowerCase() === "error" || String(data.status).toLowerCase() === "failed") {
        clearInterval(tnvedPollInterval);
        tnvedPollInterval = null;
        resultDiv.innerHTML = createErrorBlock(data.detail || "Ошибка анализа ТН ВЭД");
      }
    } catch (error) {
      clearInterval(tnvedPollInterval);
      tnvedPollInterval = null;
      resultDiv.innerHTML = createErrorBlock(`Ошибка опроса: ${error.message}`);
    }
  }, 1000);
}

async function getTnvedRecommendations() {
  const resultDiv = DOM.tnvedResult;
  if (!resultDiv) return;

  if (tnvedPollInterval) {
    clearInterval(tnvedPollInterval);
    tnvedPollInterval = null;
  }

  const goodsDescription = norm($("goodsDescription")?.textContent || "");
  if (!goodsDescription) {
    resultDiv.innerHTML = createErrorBlock("Сначала заполните описание товара в графе 31");
    return;
  }

  resultDiv.innerHTML = `
    <div style="color:#666;text-align:center;padding:20px;">
      <div style="font-size:24px;margin-bottom:10px;">⏳</div>
      <p>Отправляем запрос на анализ...</p>
    </div>
  `;

  try {
    const response = await fetch(appUrl("/tnvedcode/request"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goodsDescription,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();
    const taskId = data.id;

    if (!taskId) {
      throw new Error("Не получен ID задачи");
    }

    startTnvedPolling(taskId);
  } catch (error) {
    resultDiv.innerHTML = createErrorBlock(`Ошибка: ${error.message}`);
  }
}

window.getTnvedRecommendations = getTnvedRecommendations;

// ===========================
// 14) Form buttons
// ===========================
function bindFormButtons() {
  $("clearForm")?.addEventListener("click", () => {
    if (!confirm("Очистить все поля формы?")) return;

    document.querySelectorAll(".field-input").forEach((input) => {
      if (isInputEl(input)) input.value = "";
    });

    document.querySelectorAll('[contenteditable="true"]').forEach((el) => {
      el.textContent = "";
    });

    CTX.agreement = null;
    CTX.invoice = null;
    CTX.packingList = null;
    CTX.cmr = null;
    CTX.docs44 = new Set();

    if (DOM.fileList) DOM.fileList.innerHTML = "";

    clearUnfilledHighlights();
    clearTnvedResults();
    refreshDashboardUI();
    showNotification("Форма очищена", "info");
  });

  $("saveDraft")?.addEventListener("click", () => {
    showNotification("ℹ️ Черновик: пока не реализовано", "info");
  });

  $("submitDeclaration")?.addEventListener("click", () => {
    showNotification("ℹ️ Отправка: пока не реализовано", "info");
  });

  $("exportPDF")?.addEventListener("click", () => {
    showNotification("ℹ️ Экспорт PDF: пока не реализовано", "info");
  });

  DOM.tnvedBtn?.addEventListener("click", getTnvedRecommendations);
}

// ===========================
// 15) Init
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  bindUploadUi();
  bindFormButtons();
  initFloatingStepper();
  initUnfilledTracking();
  refreshUnfilledHighlights();
  refreshDashboardUI();
});

window.addEventListener("beforeunload", () => {
  if (tnvedPollInterval) {
    clearInterval(tnvedPollInterval);
    tnvedPollInterval = null;
  }
});