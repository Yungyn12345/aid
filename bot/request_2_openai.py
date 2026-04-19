import json
import jsonschema
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from openai_client import request_document_json, request_tnved_json
from promts import CMR_extraction as cmr
from promts import DT_extraction as dt
from promts import agreement_extraction as agreement
from promts import invoice_extraction as invoice
from promts import pl_extraction as package_list

OKEI = {
    "pcs": ("796", "шт"),
    "pc": ("796", "шт"),
    "kg": ("166", "кг"),
    "kilogram": ("166", "кг"),
}


def _build_hs_prompt_for_item(
    item: Dict[str, Any],
    invoice_currency: Optional[str],
    incoterms_str: Optional[str],
) -> str:
    desc = item.get("description") or ""
    sku = item.get("model_or_sku") or ""
    qty = item.get("quantity")
    uom = item.get("uom") or ""
    net = item.get("net_weight") or item.get("net_weight_kg")
    gross = item.get("gross_weight") or item.get("gross_weight_kg")
    origin = item.get("origin_country") or ""
    manufacturer = item.get("manufacturer") or ""

    details_lines = [
        f"Описание: {desc}",
        f"Модель/артикул: {sku}" if sku else "",
        f"Количество/единица: {qty} {uom}".strip(),
        f"Вес нетто, кг: {net}" if net is not None else "",
        f"Вес брутто, кг: {gross}" if gross is not None else "",
        f"Страна происхождения: {origin}" if origin else "",
        f"Производитель: {manufacturer}" if manufacturer else "",
        f"Валюта инвойса: {invoice_currency}" if invoice_currency else "",
        f"Условия поставки: {incoterms_str}" if incoterms_str else "",
    ]
    return "\n".join(line for line in details_lines if line)


def extract_from_pdf_file(path_to_pdf: str, instruction, schema) -> Dict[str, Any]:
    with open(path_to_pdf, "rb") as f:
        pdf_bytes = f.read()

    return request_document_json(
        pdf_bytes=pdf_bytes,
        instruction=instruction,
        schema=schema,
        schema_name=Path(path_to_pdf).stem.replace("-", "_"),
        file_name=Path(path_to_pdf).name,
    )


def validate_result(data: Dict[str, Any], schema) -> None:
    jsonschema.validate(instance=data, schema=schema)


def classify_items_eaeu(invoice_json: Dict[str, Any], pl_json: Dict[str, Any]) -> List[Dict[str, Any]]:
    pl_index = {}
    for it in pl_json.get("items", []) or []:
        key = ((it.get("model_or_sku") or "").strip().lower(), (it.get("description") or "").strip().lower())
        pl_index[key] = it

    def enrich(inv_item: Dict[str, Any]) -> Dict[str, Any]:
        key = ((inv_item.get("model_or_sku") or "").strip().lower(), (inv_item.get("description") or "").strip().lower())
        extra = pl_index.get(key, {})
        merged = dict(inv_item)
        for field_name, value in extra.items():
            if merged.get(field_name) in (None, "", 0):
                merged[field_name] = value
        return merged

    currency = ((invoice_json.get("currency") or {}).get("code") or "").upper() or None
    inc = invoice_json.get("incoterms") or {}
    incoterms_str = (
        f"{inc.get('rule', '')} {inc.get('place', '')}".strip()
        + (f", {inc.get('version')}" if inc.get("version") else "")
    ) or None

    results: List[Dict[str, Any]] = []
    for idx, inv_item in enumerate(invoice_json.get("items") or [], start=1):
        merged_item = enrich(inv_item)
        prompt = _build_hs_prompt_for_item(merged_item, currency, incoterms_str)

        try:
            hs = request_tnved_json(
                prompt=prompt,
                instruction=dt.DT_INSTRUCTION_RU,
                schema=dt.HS_SCHEMA,
                schema_name="tnved_classification",
            )
            code = hs.get("eaeu_hs_code")
            if not code or len(code) != 10 or not code.isdigit():
                raise ValueError(f"некорректный код: {code}")
            if len(hs.get("explanations", [])) != 5:
                raise ValueError("нужно ровно 5 строк объяснений.")

            results.append(
                {
                    "line_index": idx,
                    "description": inv_item.get("description"),
                    "model_or_sku": inv_item.get("model_or_sku"),
                    "eaeu_hs_code": code,
                    "confidence": hs.get("confidence"),
                    "explanations": hs.get("explanations"),
                    "candidate_codes": hs.get("candidate_codes", []),
                    "evidence_urls": hs.get("evidence_urls", []),
                    "notes": hs.get("notes", ""),
                }
            )
        except Exception as exc:
            results.append(
                {
                    "line_index": idx,
                    "description": inv_item.get("description"),
                    "model_or_sku": inv_item.get("model_or_sku"),
                    "error": f"HS-классификация не получена: {exc}",
                }
            )
    return results


def fmt_incoterms(src: Dict[str, Any]) -> Optional[str]:
    if not src:
        return None
    rule = src.get("rule")
    place = src.get("place")
    version = src.get("version")
    if not (rule and place):
        return None
    return f"{rule} {place}" + (f", {version}" if version else "")


def party_from_invoice_or_contract(invoice_doc: Dict, contract: Dict, key: str) -> Dict[str, Any]:
    invoice_party = (invoice_doc.get(key) or {}) if invoice_doc else {}
    contract_party = (contract.get(key) or {}) if contract else {}
    return {**contract_party, **invoice_party}


def normalize_country(country: Optional[str]) -> Optional[str]:
    if not country:
        return None
    return country.strip()


def money(value: Any, currency: Optional[str]) -> str:
    if value is None:
        return "—"
    try:
        val = float(value)
    except Exception:
        return str(value)
    return f"{val:,.2f}".replace(",", " ") + (f" {currency}" if currency else "")


def uom_okei(uom: Optional[str]) -> Tuple[str, str]:
    if not uom:
        return ("", "")
    return OKEI.get(uom.strip().lower(), ("", uom))


def index_items(items: List[Dict[str, Any]]) -> Dict[Tuple[str, str], Dict[str, Any]]:
    idx = {}
    for item in items or []:
        model = (item.get("model_or_sku") or "").strip().lower()
        desc = (item.get("description") or "").strip().lower()
        idx[(model or "", desc or "")] = item
    return idx


def best_key(model_or_sku: Optional[str], description: Optional[str]) -> Tuple[str, str]:
    model = (model_or_sku or "").strip().lower()
    desc = (description or "").strip().lower()
    return (model or "", desc or "")


def build_dt_text(invoice_doc: Dict, pl: Dict, cmr_doc: Dict, contract: Dict) -> str:
    currency_code = ((invoice_doc.get("currency") or {}).get("code") or "").upper() or None
    total_amount = invoice_doc.get("total_amount")

    seller = party_from_invoice_or_contract(invoice_doc, contract, "seller")
    buyer = party_from_invoice_or_contract(invoice_doc, contract, "buyer")

    country_dispatch = None
    if cmr_doc.get("place_and_date_taking_over", {}).get("place"):
        country_dispatch = normalize_country(cmr_doc.get("route_countries", [None])[0] or None) or normalize_country(
            (cmr_doc["place_and_date_taking_over"]["place"] or "").split(",")[-1]
        )

    country_destination = None
    if cmr_doc.get("place_of_delivery", {}).get("country"):
        country_destination = normalize_country(cmr_doc["place_of_delivery"]["country"])
    else:
        route_countries = cmr_doc.get("route_countries") or []
        country_destination = normalize_country(route_countries[-1] if route_countries else None)

    incoterms_str = fmt_incoterms(invoice_doc.get("incoterms") or {}) or fmt_incoterms(contract.get("incoterms") or {})

    transport = cmr_doc.get("transport") or {}
    tractor = transport.get("tractor_plate")
    trailer = transport.get("trailer_plate")
    plate_country_code = transport.get("plate_country_code")

    pl_packages = pl.get("packages", {})
    pl_marks = (pl_packages or {}).get("marks_and_numbers") or ""

    doc_44 = []
    if contract:
        doc_44.append(("Contract", contract.get("contract_number"), contract.get("contract_date")))
        for appendix in contract.get("appendices", []) or []:
            doc_44.append((appendix.get("type") or "Appendix", appendix.get("number"), appendix.get("date")))
        for link_name, ref in (contract.get("cross_links") or {}).items():
            if ref:
                doc_44.append((link_name.replace("_", " ").title(), ref.get("number"), ref.get("date")))
    if invoice_doc:
        doc_44.append(("Invoice", invoice_doc.get("invoice_number"), invoice_doc.get("invoice_date")))
        if (invoice_doc.get("contract_reference") or {}).get("number"):
            contract_ref = invoice_doc["contract_reference"]
            doc_44.append(("Contract (ref in invoice)", contract_ref.get("number"), contract_ref.get("date")))
    if pl:
        doc_44.append(("Packing List", pl.get("pl_number"), pl.get("pl_date")))
    if cmr_doc:
        doc_44.append(("CMR", cmr_doc.get("cmr_number"), cmr_doc.get("cmr_date")))
        for related in cmr_doc.get("related_documents") or []:
            doc_44.append((related.get("type"), related.get("number"), related.get("date")))

    if doc_44:
        doc_lines = "; ".join([f"{title or 'Док.'} №{number or '—'} от {date or '—'}" for (title, number, date) in doc_44])
    else:
        doc_lines = "—"

    header_lines = [
        f"[2] Отправитель (продавец) — {seller.get('name') or '—'}; {seller.get('address') or seller.get('legal_address') or '—'}; VAT/рег: {seller.get('vat_or_reg_number') or '—'}",
        f"[8] Получатель (покупатель/импортер) — {buyer.get('name') or '—'}; {buyer.get('address') or buyer.get('legal_address') or '—'}; ИНН: {buyer.get('inn') or '—'}; КПП: {buyer.get('kpp') or '—'}",
        f"[15] Страна отправления — {country_dispatch or '—'}",
        f"[17] Страна назначения — {country_destination or '—'}",
        f"[20] Условия поставки — {incoterms_str or '—'}",
        f"[21] Идентификация ТС — тягач: {tractor or '—'}; прицеп: {trailer or '—'}; страна номера: {plate_country_code or '—'}",
        f"[22] Валюта и сумма по счету — {currency_code or '—'}; Итого: {money(total_amount, currency_code)}",
        "[25] Вид транспорта на границе — 30 (автодорожный)",
        "[26] Вид транспорта внутри страны — 30 (автодорожный)",
        f"[31] Упаковка/маркировка (сводно) — {pl.get('packages', {}).get('total_packages') or '—'} мест; {pl.get('packages', {}).get('package_type') or '—'}; Marks: {pl_marks or '—'}",
        "[33] Код товара (ТН ВЭД ЕАЭС) — требуется классификация",
        "[34] Страна происхождения — по позициям/документам происхождения (если указаны)",
        f"[35] Вес брутто (общий) — {(pl.get('gross_weight_total') or pl.get('gross_weight_total_kg') or cmr_doc.get('gross_weight_total_kg')) if (pl.get('gross_weight_total') or pl.get('gross_weight_total_kg') or cmr_doc.get('gross_weight_total_kg')) is not None else '—'} кг",
        f"[38] Вес нетто (общий) — {(pl.get('net_weight_total') or pl.get('net_weight_total_kg') or cmr_doc.get('net_weight_total_kg')) if (pl.get('net_weight_total') or pl.get('net_weight_total_kg') or cmr_doc.get('net_weight_total_kg')) is not None else '—'} кг",
        "[41] Доп. ед. изм./количество — см. по позициям; привести к кодам ОКЕИ/ЕАЭС",
        "[42] Цена за единицу — см. по позициям (из инвойса)",
        f"[44] Доп. документы — {doc_lines}",
        "[46] Статистическая стоимость — расчетная (по правилам статистики/курсам)",
        "[47] Налоги/платежи — расчетные (ставки по коду ТН ВЭД)",
    ]

    inv_items = invoice_doc.get("items") or []
    pl_items = pl.get("items") or []
    idx_pl = index_items(pl_items)

    lines_block = []
    for line_no, inv_item in enumerate(inv_items, start=1):
        key = best_key(inv_item.get("model_or_sku"), inv_item.get("description"))
        pl_item = idx_pl.get(key)
        if not pl_item and key[1]:
            pl_item = next(
                (item for item in pl_items if (item.get("description") or "").strip().lower() == key[1]),
                None,
            )

        desc = inv_item.get("description") or (pl_item or {}).get("description") or "—"
        model = inv_item.get("model_or_sku") or (pl_item or {}).get("model_or_sku") or ""
        desc_show = f"{desc}; модель/артикул: {model}" if model and model.lower() not in desc.lower() else desc

        qty = inv_item.get("quantity")
        uom = inv_item.get("uom") or (pl_item or {}).get("uom")
        okei_code, okei_name = uom_okei(uom)
        gross = (pl_item or {}).get("gross_weight") or (pl_item or {}).get("gross_weight_kg")
        net = (pl_item or {}).get("net_weight") or (pl_item or {}).get("net_weight_kg")
        packaging = (pl_item or {}).get("packaging") or {}
        packs = []
        if packaging:
            if packaging.get("packages_qty"):
                packs.append(f"{packaging['packages_qty']} мест")
            if packaging.get("package_type"):
                packs.append(str(packaging["package_type"]))
            if packaging.get("marks_range"):
                packs.append(f"Marks: {packaging['marks_range']}")
        packs_show = ", ".join(packs) or "—"

        origin = inv_item.get("origin_country") or (pl_item or {}).get("origin_country") or "—"
        unit_price = inv_item.get("unit_price")

        lines_block.append(f"[31] Позиция {line_no}: {desc_show}. Упаковка/маркировка: {packs_show}")
        lines_block.append(f"[34] Страна происхождения — {origin}")
        lines_block.append(f"[35] Вес брутто (кг) — {gross if gross is not None else '—'}")
        lines_block.append(f"[38] Вес нетто (кг) — {net if net is not None else '—'}")
        if qty is not None or uom:
            suffix = f" (ОКЕИ {okei_code} {okei_name})" if okei_code else ""
            lines_block.append(f"[41] Кол-во/ед. — {qty if qty is not None else '—'} {uom or ''}{suffix}")
        lines_block.append(f"[42] Цена за единицу — {money(unit_price, currency_code)}")
        lines_block.append("[45] Таможенная стоимость по строке — требуется расчет (учет Incoterms/фрахта/страховки)")
        lines_block.append("[46] Стат. стоимость по строке — расчет от таможенной стоимости (валюта статистики)")
        lines_block.append("")

    return "\n".join(header_lines) + "\n\n" + "\n".join(lines_block).rstrip()
