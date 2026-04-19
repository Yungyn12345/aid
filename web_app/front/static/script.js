/* =========================================================
   script.js — единая архитектура автозаполнения (PDF + DEMO)
   ========================================================= */

// ===========================
// 0) Состояние
// ===========================
const CTX = {
  agreement: null,     // contract/agreement json
  invoice: null,
  packingList: null,
  cmr: null,
  docs44: new Set(),
};

const LOAD = {
  pending: 0,
  scheduled: false,
};

function beginBatch() {
  LOAD.pending++;
}

function endBatch() {
  LOAD.pending = Math.max(0, LOAD.pending - 1);

  // когда всё закончится — один раз применим autofillAll
  if (LOAD.pending === 0 && !LOAD.scheduled) {
    LOAD.scheduled = true;
    setTimeout(() => {
      LOAD.scheduled = false;
      autofillAll();
      showNotification("✅ Все документы обработаны — поля заполнены");
    }, 0);
  }
}

// ===========================
// 1) Утилиты (DOM + normalize)
// ===========================
function $(id) { return document.getElementById(id); }

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
  if (!path) return APP_BASE_PATH || "/";
  return `${APP_BASE_PATH}${path}`;
}

function norm(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}
function isEmpty(v) { return !norm(v); }

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

  // не перетираем "заглушку" только если force=false
  const isPlaceholder = cur.startsWith("Здесь можно") || cur.startsWith("Дополнительная информация");
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
// 2) Адреса / страны (эвристики)
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

  const parts = a.split(",").map(x => x.trim()).filter(Boolean);
  if (!parts.length) return "";

  if (iso2 === "RU") {
    const cityPart = parts.find(p => /(^г\.?\s)|город|москва|санкт|екатеринбург|новосибирск/i.test(p));
    if (cityPart) return cityPart.replace(/^г\.?\s*/i, "");
    return parts[2] ? parts[2].replace(/^г\.?\s*/i, "") : (parts[1] || "");
  }

  if (iso2 === "DE") {
    const pc = extractPostalCode(a);
    const pcCity = parts.find(p => pc && p.includes(pc));
    if (pcCity) return pcCity.replace(pc, "").trim();
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  }

  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

function fillAddressBlock(prefix /* sender|receiver */, party, { force = true } = {}) {
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

  // Идентификаторы — мягко
  setField(`${prefix}INN`, party.inn || party.vat_or_tax_id || party.vat_or_reg_number, { force: false });
  setField(`${prefix}OKPO`, party.okpo, { force: false });
}

// ===========================
// 3) Нотификации (одна версия)
// ===========================
function showNotification(message) {
  const container = $("notifications-container") || (() => {
    const c = document.createElement("div");
    c.id = "notifications-container";
    c.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      display: flex; flex-direction: column; align-items: flex-end;
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

  const n = document.createElement("div");
  n.style.cssText = `
    background: #0056b3; color: white; padding: 12px 20px; border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 10px;
    font-size: 13px; animation: slideIn 0.3s ease;
    width: 320px; max-width: calc(100vw - 40px); box-sizing: border-box;
  `;
  n.innerHTML = message;
  container.appendChild(n);

  setTimeout(() => {
    n.style.animation = "slideOut 0.25s ease";
    setTimeout(() => n.remove(), 250);
  }, 3200);
}

// ===========================
// 4) Мобильное меню
// ===========================
(function initMobileMenu() {
  const mobileMenuToggle = $("mobileMenuToggle");
  const closeSidebar = $("closeSidebar");
  const sidebarOverlay = $("sidebarOverlay");
  const sidebar = $("sidebar");

  mobileMenuToggle?.addEventListener("click", () => {
    sidebar?.classList.add("active");
    sidebarOverlay?.classList.add("active");
  });

  closeSidebar?.addEventListener("click", () => {
    sidebar?.classList.remove("active");
    sidebarOverlay?.classList.remove("active");
  });

  sidebarOverlay?.addEventListener("click", () => {
    sidebar?.classList.remove("active");
    sidebarOverlay?.classList.remove("active");
  });
})();

// ===========================
// 5) Загрузка файлов UI
// ===========================
const fileInput = $("fileInput");
const uploadArea = $("uploadArea");
const fileList = $("fileList");

uploadArea?.addEventListener("click", () => {
  if (!fileInput) return;
  fileInput.value = "";
  fileInput.click();
});

uploadArea?.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#0056b3";
  uploadArea.style.backgroundColor = "#f0f7ff";
});
uploadArea?.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#ccc";
  uploadArea.style.backgroundColor = "white";
});
uploadArea?.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#ccc";
  uploadArea.style.backgroundColor = "white";
  handleFiles(e.dataTransfer.files);
});

fileInput?.addEventListener("change", (e) => {
  const files = Array.from(e.target.files || []);
  handleFiles(files);
  e.target.value = "";
});

function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return ext === "pdf" ? "📕" : "📄";
}

function addFileToList(file) {
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";

  const fileSize = file.size ? (file.size / 1024 / 1024).toFixed(2) : "—";
  fileItem.innerHTML = `
    <div class="file-icon">${getFileIcon(file.name || "DEMO")}</div>
    <div class="file-name" title="${file.name || "DEMO"}">${file.name || "DEMO"} (${fileSize} MB)</div>
    <div class="file-status processing">Ожидание...</div>
  `;
  fileList?.appendChild(fileItem);
  return fileItem;
}

function updateFileStatus(fileItem, text, statusClass) {
  const el = fileItem?.querySelector(".file-status");
  if (!el) return;
  el.textContent = text;
  el.className = `file-status ${statusClass}`;
}

function detectDocType(filename) {
  const name = (filename || "").toLowerCase();

  const isPL =
    name.includes("packing") ||
    name.includes("pack_list") ||
    name.includes("packing_list") ||
    name.includes("upl") ||          // если у тебя так бывает
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
    showNotification("❌ Не удалось получить PDF-файлы для загрузки");
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const file = list[i];
    const item = addFileToList(file);
    updateFileStatus(item, "Анализ...", "processing");

    const type = detectDocType(file.name);

    if (type === "agreement") processAgreement(file, item);
    else if (type === "invoice") processInvoice(file, item);
    else if (type === "packing_list") processPackingList(file, item);
    else if (type === "cmr") processCmr(file, item);
    else processAuto(file, item); // <— важное: фолбэк
  }
}

async function processAuto(file, fileItem) {
  const tries = [
    { label: "Инвойс",      request: "/invoice/request",       result: "/invoice/result",       accept: acceptInvoice },
    { label: "Упаковочный", request: "/packing_list/request", result: "/packing_list/result",  accept: acceptPackingList },
    { label: "CMR",         request: "/cmr/request",          result: "/cmr/result",          accept: acceptCmr },
    { label: "Договор",     request: "/agreement/request",    result: "/agreement/result",     accept: acceptAgreement },
  ];

  for (const t of tries) {
    try {
      updateFileStatus(fileItem, `Пробуем: ${t.label}...`, "processing");
      const id = await uploadPDF(file, t.request);

      pollResult(id, t.result, (json) => {
        t.accept(json);
        showNotification(`✅ Документ распознан как: ${t.label}`);
      }, fileItem);

      return;
    } catch (e) {
      console.warn(`[AUTO] ${t.label} failed:`, e.message);
    }
  }

  updateFileStatus(fileItem, "✕", "error");
  showNotification("❌ Не удалось определить тип документа. Переименуй файл (invoice/pl/cmr/contract) или добавь ручной выбор типа.");
}

// ===========================
// 6) API: upload + poll (real + demo)
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
  // поддержка demo: status === true
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
        showNotification(`❌ Ошибка: ${data?.detail || "Задача завершилась с ошибкой"}`);
        endBatch();
        return;
      }

      if (!isDoneStatus(st)) return; // ждём дальше

      clearInterval(t);

      let payload = data.result;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch {}
      }

      updateFileStatus(fileItem, "✓", "success");
      onDone(payload);

      // ✅ НЕ вызываем autofillAll() здесь
      endBatch();
    } catch (e) {
      clearInterval(t);
      updateFileStatus(fileItem, "✕", "error");
      showNotification(`❌ Ошибка: ${e.message}`);
      endBatch();
    }
  }, 900);
}

// DEMO helper:
// 1) пробуем /demo/request/{type} → вернёт {id} → poll /demo/result/{id}
// 2) если нет — пробуем /demo/{type} → сразу json
async function demoLoadDoc(type) {
  // task style
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
                try { payload = JSON.parse(payload); } catch { /* */ }
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
  } catch { /* ignore */ }

  // direct json
  const r2 = await fetch(appUrl(`/demo/${type}`), { method: "GET" });
  if (!r2.ok) throw new Error(await extractErrorMessage(r2));
  return await r2.json();
}

// ===========================
// 7) Acceptors: кладём JSON в CTX + 44 документы
// ===========================
function acceptAgreement(json) {
  CTX.agreement = (json && !json.error) ? json : null;
  if (!CTX.agreement) return;

  const a = CTX.agreement;
  if (a.contract_number) addDoc44(`Договор ${a.contract_number}${a.contract_date ? ` от ${a.contract_date}` : ""}`);
}

function acceptInvoice(json) {
  CTX.invoice = (json && !json.error) ? json : null;
  if (!CTX.invoice) return;

  const i = CTX.invoice;
  if (i.invoice_number) addDoc44(`Инвойс ${i.invoice_number}${i.invoice_date ? ` от ${i.invoice_date}` : ""}`);
  if (i.contract_reference?.number) {
    addDoc44(`Договор ${i.contract_reference.number}${i.contract_reference.date ? ` от ${i.contract_reference.date}` : ""}`);
  }
}

function acceptPackingList(json) {
  CTX.packingList = (json && !json.error) ? json : null;
  if (!CTX.packingList) return;

  const p = CTX.packingList;
  if (p.packing_list_number) addDoc44(`Упаковочный лист ${p.packing_list_number}${p.packing_list_date ? ` от ${p.packing_list_date}` : ""}`);
}

function acceptCmr(json) {
  CTX.cmr = (json && !json.error) ? json : null;
  if (!CTX.cmr) return;

  const c = CTX.cmr;
  if (c.cmr_number) addDoc44(`CMR ${c.cmr_number}${c.cmr_date ? ` от ${c.cmr_date}` : ""}`);

  if (Array.isArray(c.related_documents)) {
    c.related_documents.forEach(d => {
      if (!d) return;
      let s = norm(d.type);
      if (d.number) s += ` ${d.number}`;
      if (d.date) s += ` от ${d.date}`;
      if (s) addDoc44(s);
    });
  }
}

// ===========================
// 8) Реальные обработчики PDF
// ===========================
async function processAgreement(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/agreement/request");
    pollResult(id, "/agreement/result", (json) => {
      acceptAgreement(json);
      showNotification("✅ Договор распознан");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ Договор: ${e.message}`);
  }
}

async function processInvoice(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/invoice/request");
    pollResult(id, "/invoice/result", (json) => {
      acceptInvoice(json);
      showNotification("✅ Инвойс распознан");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ Инвойс: ${e.message}`);
  }
}

async function processPackingList(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/packing_list/request");
    pollResult(id, "/packing_list/result", (json) => {
      acceptPackingList(json);
      showNotification("✅ Упаковочный лист распознан");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ Упаковочный лист: ${e.message}`);
  }
}

async function processCmr(file, fileItem) {
  try {
    updateFileStatus(fileItem, "Анализ...", "processing");
    const id = await uploadPDF(file, "/cmr/request");
    pollResult(id, "/cmr/result", (json) => {
      acceptCmr(json);
      showNotification("✅ CMR распознан");
    }, fileItem);
  } catch (e) {
    updateFileStatus(fileItem, "✕", "error");
    showNotification(`❌ CMR: ${e.message}`);
  }
}

// ===========================
// 9) DEMO: кнопка “Загрузить демонстрационные документы”
// ===========================
async function startDemoLoading() {
const btn = document.getElementById("start-demo-button");
  if (btn) btn.remove();
  try {
    // добавим “виртуальные файлы” в список
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
      demoLoadDoc("contract"), // если у тебя demo договора называется contract
    ]);

    acceptPackingList(pl); updateFileStatus(demoPL, "✓", "success");
    acceptInvoice(inv);    updateFileStatus(demoINV, "✓", "success");
    acceptCmr(cmr);        updateFileStatus(demoCMR, "✓", "success");
    acceptAgreement(agr);  updateFileStatus(demoAGR, "✓", "success");

    autofillAll();
    showNotification("✅ Демо-данные загружены и применены");

    const btn = $("start-demo-button");
    btn?.remove();
  } catch (e) {
    showNotification(`❌ DEMO: ${e.message}`);
  }
}
window.startDemoLoading = startDemoLoading; // чтобы onclick="startDemoLoading()" работал

// ===========================
// 10) ЕДИНАЯ точка автозаполнения “ВСЕ ПОЛЯ”
// ===========================
function pick(...vals) {
  for (const v of vals) {
    if (!isEmpty(v)) return v;
  }
  return "";
}

function firstItem(doc) {
  return (doc && Array.isArray(doc.items) && doc.items.length) ? doc.items[0] : null;
}

// ===========================
// Графа 31 (как у ALTA): 1- 2- 2.1- 3-
// ===========================
function pickMainItemFromCtx(CTX) {
  const p = CTX.packingList || {};
  const i = CTX.invoice || {};
  const c = CTX.cmr || {};

  const itemP = Array.isArray(p.items) ? p.items[0] : null;
  const itemI = Array.isArray(i.items) ? i.items[0] : null;
  const itemC = Array.isArray(c.items) ? c.items[0] : null;

  return itemP || itemI || itemC || null;
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

  const parts = raw.split(/[,;]/).map(x => x.trim()).filter(Boolean);
  const out = [];

  for (const part of parts) {
    const mQty = part.match(/\b(\d+)\b/);
    const qty = mQty ? parseInt(mQty[1], 10) : null;

    let hit = null;
    for (const it of map) {
      if (it.re.test(part)) { hit = it; break; }
    }
    if (qty && hit) out.push({ qty, code: hit.code });
  }
  return out;
}

function sumPackages(list) {
  return list.reduce((acc, x) => acc + (Number(x.qty) || 0), 0);
}

function getPackagingFromCtx(CTX) {
  const p = CTX.packingList || {};
  const c = CTX.cmr || {};

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

function buildGraph31Text(CTX) {
  const a = CTX.agreement || {};
  const i = CTX.invoice || {};
  const c = CTX.cmr || {};
  const item = pickMainItemFromCtx(CTX);

  // 1- описание товара
  const desc = (item?.description || item?.name || "").trim();
  const brand = (item?.brand || item?.trademark || "").trim();
  const model = (item?.model || item?.part_number || item?.article || "").trim();

  const manufacturer =
    (item?.manufacturer || i.seller?.name || a.seller?.name || "").trim();

  // ✅ subject из agreement.json
  const subject = (a.subject || "").trim();

  const line1Parts = [
    desc,
    brand ? `ТМ: ${brand}` : "",
    model ? `Модель/арт.: ${model}` : "",
    manufacturer ? `Производитель: ${manufacturer}` : "",
    subject ? `Тема: ${subject}` : "",
  ].filter(Boolean);

  const line1 = line1Parts.length ? `1- ${line1Parts.join("; ")}` : "";

  // 2- грузовые места / упаковка
  const { totalPlaces, kind, marks } = getPackagingFromCtx(CTX);
  const parsed = parsePackagesString(kind);
  const placesFromParsed = parsed.length ? sumPackages(parsed) : null;
  const places = (totalPlaces != null) ? totalPlaces : placesFromParsed;

  const packCodes = parsed.length
    ? parsed.map(x => `${x.code}-${x.qty}`).join(", ")
    : (kind ? kind : "");

  const line2 = (places != null || packCodes)
    ? `2- ${[places != null ? String(places) : "", packCodes].filter(Boolean).join(", ")}`
    : "";

  // 2.1- маркировка
  const line21 = marks ? `2.1- Маркировка: ${marks}` : "";

  // 3- транспорт
  const veh = c.transport || c.vehicle || {};
  const tractor = (veh.tractor_plate || veh.truck || c.truck || "").trim();
  const trailer = (veh.trailer_plate || veh.trailer || c.trailer || "").trim();
  const vehStr = [tractor && `тягач ${tractor}`, trailer && `прицеп ${trailer}`].filter(Boolean).join(", ");
  const line3 = vehStr ? `3- Транспорт: ${vehStr}` : "";

  return [line1, line2, line21, line3].filter(Boolean).join("\n");
}

function fillGraph31FromCtx(CTX, { force = true } = {}) {
  const text = buildGraph31Text(CTX);
  if (!text) return;
  // goodsDescription = contenteditable div
  setEditable("goodsDescription", text, { force });
}

function autofillAll() {
  const a = CTX.agreement || {};
  const i = CTX.invoice || {};
  const p = CTX.packingList || {};
  const c = CTX.cmr || {};

  // ---------- стороны (2 / 8) ----------
  // Приоритет по факту отгрузки: PL > CMR > Agreement > Invoice
  const sender = p.shipper || c.consignor || a.seller || i.seller || {};
  const receiver = p.consignee || c.consignee || a.buyer || i.buyer || {};

  fillAddressBlock("sender", sender, { force: true });
  fillAddressBlock("receiver", receiver, { force: true });

  // ---------- 54 договор ----------
  const contractNumber = pick(a.contract_number, i.contract_reference?.number);
  const contractDate = pick(a.contract_date, i.contract_reference?.date);
  if (contractNumber) {
    setField("clientContract", contractDate ? `${contractNumber} от ${contractDate}` : contractNumber, { force: true });
  }

  // ---------- 22 валюта и сумма ----------
  const curCode = pick(i.currency?.code, a.currency?.code, i.currency, a.currency);
  const totalAmount = (i.total_amount != null) ? i.total_amount : a.total_amount;
  if (curCode || totalAmount != null) {
    setField("currencyTotal", `${norm(curCode)} ${norm(totalAmount)}`.trim(), { force: true });
  }

  // ---------- 12 общая таможенная ----------
  if (totalAmount != null) setField("totalCustomsValue", String(totalAmount), { force: true });

  // ---------- 13 Incoterms ----------
  const inc = i.incoterms || a.incoterms;
  if (inc) {
    const incStr =
      (typeof inc === "string")
        ? inc
        : [inc.rule, inc.place].filter(Boolean).join(" ") + (inc.version ? `, ${inc.version}` : "");
    if (norm(incStr)) setField("field13", incStr, { force: true });
  }

  // ---------- 48 условия платежа ----------
  setField("paymentDeferral", pick(i.payment_terms, a.payment_terms), { force: true });

  // ---------- товары (центральный блок) ----------
  const itemP = firstItem(p);
  const itemI = firstItem(i);
  const itemC = firstItem(c);

  // 31 описание (contenteditable!)
  fillGraph31FromCtx(CTX, { force: true });

  // 32 товар № — если 1 позиция, ставим 1
  function parsePackagesString(s) {
  const raw = (s || "").toLowerCase();
  if (!raw) return [];

  const map = [
    { re: /(carton|cartons|короб|коробк)/, code: "CT", label: "короб" },
    { re: /(pallet|pallets|поддон|паллет)/, code: "PX", label: "поддон" },
    { re: /(box|boxes|ящик|ящики)/, code: "BX", label: "ящик" },
    { re: /(bag|bags|мешок|мешки)/, code: "BG", label: "мешок" },
    { re: /(case|cases)/, code: "CS", label: "ящик/кейс" },
  ];

  // режем по запятым: "10 cartons, 2 pallets"
  const parts = raw.split(/[,;]/).map(x => x.trim()).filter(Boolean);
  const out = [];

  for (const p of parts) {
    const mQty = p.match(/\b(\d+)\b/);
    const qty = mQty ? parseInt(mQty[1], 10) : null;

    let hit = null;
    for (const it of map) {
      if (it.re.test(p)) { hit = it; break; }
    }

    if (qty && hit) out.push({ qty, code: hit.code, label: hit.label });
  }

  return out;
}

function sumPackages(list) {
  return list.reduce((acc, x) => acc + (Number(x.qty) || 0), 0);
}

// из разных возможных мест берем инфу по упаковке
function getPackagingFromCtx(CTX) {
  const p = CTX.packingList || {};
  const c = CTX.cmr || {};

  // 1) число мест
  const totalPlaces =
    p.cargo_summary?.total_packages ??
    p.packages_summary?.number_of_packages ??
    p.packages?.total_packages ??
    c.packages_summary?.number_of_packages ??
    null;

  // 2) строка с типами упаковки
  const kind =
    p.cargo_summary?.kind_of_packages ??
    p.packages_summary?.kind_of_packages ??
    p.packages?.package_type ??
    "";

  // 3) маркировка/номера мест
  const marks =
    p.packages?.marks_and_numbers ??
    p.packages_summary?.marks_and_numbers ??
    "";

  return { totalPlaces, kind, marks };
}

function pickMainItemFromCtx(CTX) {
  const p = CTX.packingList || {};
  const i = CTX.invoice || {};
  const c = CTX.cmr || {};

  const itemP = Array.isArray(p.items) ? p.items[0] : null;
  const itemI = Array.isArray(i.items) ? i.items[0] : null;
  const itemC = Array.isArray(c.items) ? c.items[0] : null;

  return itemP || itemI || itemC || null;
}

// Вызов заполнения графы 31
function fillGraph31FromCtx(CTX, { force = true } = {}) {
  const text = buildGraph31Text(CTX);
  if (!text) return;

  // goodsDescription — это contenteditable div, поэтому используем setEditable
  // (если у тебя нет setEditable — добавь или замени на el.textContent = text)
  if (typeof setEditable === "function") {
    setEditable("goodsDescription", text, { force });
  } else {
    const el = document.getElementById("goodsDescription");
    if (!el) return;
    if (!force && (el.textContent || "").trim()) return;
    el.textContent = text;
  }
}
  // 33 ТН ВЭД / HS
  const hs = pick(itemP?.hs_code, itemI?.hs_code, itemP?.tnved, itemI?.tnved);
  if (hs) setField("tnVedCode", hs, { force: false }); // не перетираем вручную выбранный код

  // 34 страна происхождения
  const originCountry = pick(itemP?.origin_country, itemI?.origin_country, a.origin_and_manufacturer, sender.country);
  // a.origin_and_manufacturer может быть строкой — если так, не пихаем “Германия. Производитель...”
  if (originCountry) {
    // если это длинная строка — пробуем вытащить страну из нее
    let oc = originCountry;
    if (oc.length > 30) {
      const m = oc.match(/(Германия|Россия|Китай|Польша|Беларусь|Germany|Russia|China|Poland|Belarus)/i);
      if (m) oc = m[0];
    }
    setField("originCountry", oc, { force: true });
  }

  // количество + uom (41/кол-во)
  const qty = (itemP?.quantity != null) ? itemP.quantity : itemI?.quantity;
  if (qty != null) setField("quantity", String(qty), { force: true });

  const uom = pick(itemP?.unit, itemP?.uom, itemI?.uom);
  if (uom) setField("uom", uom, { force: true });

  // 42 цена товара
  if (itemI?.unit_price != null) setField("productPrice", String(itemI.unit_price), { force: true });

  // 35 брутто
  if (c.gross_weight_total_kg != null) setField("grossWeight", String(c.gross_weight_total_kg), { force: true });
  else if (itemP?.gross_weight_kg != null) setField("grossWeight", String(itemP.gross_weight_kg), { force: true });

  // 38 нетто по позиции
  if (itemP?.net_weight_kg != null) setField("netWeightProduct", String(itemP.net_weight_kg), { force: true });

  // ---------- 5 всего товаров/мест ----------
  const totalGoods =
    (p.cargo_summary?.total_packages != null) ? p.cargo_summary.total_packages :
    (c.packages_summary?.number_of_packages != null) ? c.packages_summary.number_of_packages :
    (Array.isArray(i.items) ? i.items.length : null);

  if (totalGoods != null) setField("totalGoods", String(totalGoods), { force: true });

  // ---------- 6 вес нетто общий ----------
  const netTotal =
    (p.cargo_summary?.total_net_weight_kg != null) ? p.cargo_summary.total_net_weight_kg :
    (c.net_weight_total_kg != null) ? c.net_weight_total_kg :
    null;

  if (netTotal != null) setField("netWeight", String(netTotal), { force: true });

  // ---------- 11 / 15-16-17 страны ----------
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

  // ---------- 18 / 21 транспорт ----------
  if (CTX.cmr) {
    setField("transportDeparture", "Автомобильный", { force: true });
  }

  // В 21 — либо “Автомобильный”, либо номера ТС если есть
  const veh = c.vehicle || c.transport || {};
  const truck = pick(veh.truck, c.truck);
  const trailer = pick(veh.trailer, c.trailer);
  const vehStr = [truck ? `Тягач: ${truck}` : "", trailer ? `Прицеп: ${trailer}` : ""].filter(Boolean).join(", ");

  if (vehStr) setField("transportBorder", vehStr, { force: true });
  else if (CTX.cmr) setField("transportBorder", "Автомобильный", { force: true });

  // ---------- 44 документы (contenteditable) ----------
  // наполняем docs44 из accept* + гарантируем ключевые строки
  if (i.invoice_number) addDoc44(`Инвойс ${i.invoice_number}${i.invoice_date ? ` от ${i.invoice_date}` : ""}`);
  if (p.packing_list_number) addDoc44(`Упаковочный лист ${p.packing_list_number}${p.packing_list_date ? ` от ${p.packing_list_date}` : ""}`);
  if (a.contract_number) addDoc44(`Договор ${a.contract_number}${a.contract_date ? ` от ${a.contract_date}` : ""}`);
  if (c.cmr_number) addDoc44(`CMR ${c.cmr_number}${c.cmr_date ? ` от ${c.cmr_date}` : ""}`);

  flushDoc44();

  // ---------- 45 / 46 (MVP: если нет, продублируем total) ----------
  if (totalAmount != null) {
    setField("customsValue", String(totalAmount), { force: false });
    setField("statisticalValue", String(totalAmount), { force: false });
  }

  refreshUnfilledHighlights();
  showNotification("✅ Поля формы обновлены по распознанным документам");
}

// ===========================
// 11) Кнопки формы
// ===========================
$("clearForm")?.addEventListener("click", () => {
  if (!confirm("Очистить все поля формы?")) return;

  document.querySelectorAll(".field-input").forEach(input => {
    if (isInputEl(input)) input.value = "";
  });
  document.querySelectorAll('[contenteditable="true"]').forEach(el => el.textContent = "");

  CTX.agreement = null;
  CTX.invoice = null;
  CTX.packingList = null;
  CTX.cmr = null;
  CTX.docs44 = new Set();
  clearUnfilledHighlights();

  showNotification("Форма очищена");
});

$("saveDraft")?.addEventListener("click", () => showNotification("ℹ️ Черновик: пока не реализовано"));
$("submitDeclaration")?.addEventListener("click", () => showNotification("ℹ️ Отправка: пока не реализовано"));
$("exportPDF")?.addEventListener("click", () => showNotification("ℹ️ Экспорт PDF: пока не реализовано"));

initUnfilledTracking();
