# bot.py
import os
import asyncio
from io import BytesIO
from pathlib import Path
from typing import List, Dict, Any, Optional

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputFile
from telegram.constants import ChatAction
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from dotenv import load_dotenv

from request_2_openai import (
    extract_from_pdf_file, validate_result, build_dt_text, classify_items_eaeu,
    invoice, package_list, cmr, agreement
)

load_dotenv()

# -------- настройки --------
DOCS_DIR = Path("./docs")
DOCS_DIR.mkdir(parents=True, exist_ok=True)
TOKEN = os.environ.get("TELEGRAM_TOKEN")

UD_RESULT_TEXT = "result_text"

# -------- utils --------
def list_pdfs() -> List[Path]:
    return sorted([p for p in DOCS_DIR.iterdir() if p.suffix.lower() == ".pdf"])

def pick_first_four(pdfs: List[Path]) -> List[Path]:
    return pdfs[:4]

async def send_docs(paths: List[Path], update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    for p in paths:
        with p.open("rb") as f:
            await context.bot.send_document(chat_id=chat_id, document=InputFile(f, filename=p.name))

def detect_required_docs(pdfs: List[Path]) -> Dict[str, Optional[Path]]:
    found = {"invoice": None, "pl": None, "cmr": None, "agreement": None}
    for p in pdfs:
        n = p.name.lower()
        if any(k in n for k in ["inv", "invoice"]):
            found["invoice"] = found["invoice"] or p
        elif any(k in n for k in ["pack", "packing", "pl"]):
            found["pl"] = found["pl"] or p
        elif "cmr" in n:
            found["cmr"] = found["cmr"] or p
        elif any(k in n for k in ["dogovor", "agreement", "contract", "ved-dogovor"]):
            found["agreement"] = found["agreement"] or p
    return found

async def run_full_pipeline_async(docs: Dict[str, Path]) -> str:
    def _run_sync() -> str:
        invoice_json = extract_from_pdf_file(str(docs["invoice"]), invoice.INVOICE_INSTRUCTION_RU, invoice.INVOICE_SCHEMA)
        validate_result(invoice_json, invoice.INVOICE_SCHEMA)

        pl_json      = extract_from_pdf_file(str(docs["pl"]), package_list.PL_INSTRUCTION_RU, package_list.PACKING_LIST_SCHEMA)
        validate_result(pl_json, package_list.PACKING_LIST_SCHEMA)

        cmr_json     = extract_from_pdf_file(str(docs["cmr"]), cmr.CMR_INSTRUCTION_RU, cmr.CMR_SCHEMA)
        validate_result(cmr_json, cmr.CMR_SCHEMA)

        ag_json      = extract_from_pdf_file(str(docs["agreement"]), agreement.AGREEMENT_INSTRUCTION_RU, agreement.AGREEMENT_SCHEMA)
        validate_result(ag_json, agreement.AGREEMENT_SCHEMA)

        dt_text = build_dt_text(invoice_json, pl_json, cmr_json, ag_json)

        hs_results = classify_items_eaeu(invoice_json, pl_json)
        lines = []
        for r in hs_results:
            if "error" in r:
                lines.append(f"[33] Позиция {r['line_index']}: ошибка — {r['error']}\n")
                continue
            lines.append(f"[33] Позиция {r['line_index']}: код ТН ВЭД ЕАЭС {r['eaeu_hs_code']} (доверие {r.get('confidence')})")
            for s in r.get("explanations") or []:
                lines.append(f"  - {s}")
            if r.get("candidate_codes"):
                lines.append("  Альтернативы:")
                for c in r["candidate_codes"]:
                    lines.append(f"    • {c['code']}: {c['why_not']}")
            if r.get("evidence_urls"):
                lines.append("  Источники:")
                for url in r["evidence_urls"]:
                    lines.append(f"    - {url}")
            lines.append("")
        hs_text = "\n".join(lines).rstrip()

        combined = (
            "Поле декларации | Вставляемый тектс:\n"
            f"{dt_text}\n\n"
            "=====================\n"
            "Товар | ТН ВЭД:\n"
            f"{hs_text}\n\n"
            "Важно: это юридическая подсказка и не более; не является юридическим заключением."
        )
        return combined

    return await asyncio.to_thread(_run_sync)

# -------- UI --------
def main_menu_text() -> str:
    return (
        "Здравствуйте! Перед вами MVP AI-таможенного брокера.\n"
        "Для демонстрации используются заранее подготовленные документы:\n"
        "— Договор\n"
        "— Инвойс\n"
        "— Международная автотранспортная накладная (CMR)\n"
        "— Упаковочный лист\n\n"
        "Нажмите «Загрузить документы», чтобы отправить файлы и запустить обработку."
    )

def main_menu_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("📥 Загрузить документы", callback_data="upload")]])

def export_menu_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📄 Выгрузить в TXT", callback_data="export_txt")],
        [InlineKeyboardButton("💬 Отправить в чат", callback_data="export_chat")],
        [InlineKeyboardButton("↩️ В главное меню", callback_data="back_to_menu")],
    ])

async def back_to_menu_prompt(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text=main_menu_text(), reply_markup=main_menu_kb())

# -------- хэндлеры --------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(main_menu_text(), reply_markup=main_menu_kb())

async def on_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    try:
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action=ChatAction.TYPING)
    except Exception:
        pass

    if query.data == "upload":
        pdfs = list_pdfs()
        if len(pdfs) < 4:
            await query.message.reply_text(
                f"В папке ./docs найдено {len(pdfs)} PDF-файлов. "
                "Для демонстрации требуется 4 файла: договор, инвойс, CMR и упаковочный лист.",
                reply_markup=main_menu_kb()
            )
            return

        four = pick_first_four(pdfs)
        await query.message.reply_text("Отправляю 4 PDF…")
        await send_docs(four, update, context)

        roles = detect_required_docs(four)
        missing_roles = [k for k, v in roles.items() if v is None]
        if missing_roles:
            await query.message.reply_text(
                "Не удалось распознать все документы по именам файлов.\n"
                "Убедитесь, что названия содержат ключевые слова: "
                "invoice/inv, packing/pack/pl, cmr, agreement/contract/dogovor.",
                reply_markup=main_menu_kb()
            )
            return

        await query.message.reply_text("Начинаю обработку документов…")
        try:
            combined_text = await run_full_pipeline_async(roles)
        except Exception as e:
            await query.message.reply_text(f"Ошибка обработки: {e}", reply_markup=main_menu_kb())
            return

        # --- ВАЖНО: не отправляем отчёт сразу ---
        context.user_data[UD_RESULT_TEXT] = combined_text
        await query.message.reply_text(  # <- новое поведение
            "Отчёт готов.\nВыберите способ получения результата:",
            reply_markup=export_menu_kb()
        )
        return

    if query.data == "export_txt":
        combined_text = context.user_data.get(UD_RESULT_TEXT)
        if not combined_text:
            await query.message.reply_text("Нет данных для экспорта. Начните заново.", reply_markup=main_menu_kb())
            return
        bio = BytesIO(combined_text.encode("utf-8"))
        bio.name = "dt_mapping__hs_classification.txt"
        await context.bot.send_document(
            chat_id=update.effective_chat.id,
            document=bio,
            caption="Результаты обработки (TXT)."
        )
        await query.message.reply_text("Готово. Вернуться в главное меню?", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("↩️ В главное меню", callback_data="back_to_menu")]
        ]))
        return

    if query.data == "export_chat":
        combined_text = context.user_data.get(UD_RESULT_TEXT)
        if not combined_text:
            await query.message.reply_text("Нет данных для отправки. Начните заново.", reply_markup=main_menu_kb())
            return
        MAX_LEN = 4000
        if len(combined_text) <= MAX_LEN:
            await query.message.reply_text(combined_text)
        else:
            chunk, size = [], 0
            for line in combined_text.splitlines(True):
                if size + len(line) > MAX_LEN:
                    await query.message.reply_text("".join(chunk))
                    chunk, size = [], 0
                chunk.append(line)
                size += len(line)
            if chunk:
                await query.message.reply_text("".join(chunk))
        await query.message.reply_text("Готово. Вернуться в главное меню?", reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("↩️ В главное меню", callback_data="back_to_menu")]
        ]))
        return

    if query.data == "back_to_menu":
        await back_to_menu_prompt(update, context)
        return

def main():
    if not TOKEN:
        raise RuntimeError("Переменная окружения TELEGRAM_TOKEN не задана.")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(on_callback))
    print("Бот запущен. Нажмите Ctrl+C для остановки.")
    app.run_polling(close_loop=False)

if __name__ == "__main__":
    main()
