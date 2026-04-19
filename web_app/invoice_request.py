from __future__ import annotations

import uuid
import asyncio
import json

from fastapi import APIRouter, UploadFile, File, HTTPException

from external_api.openai_invoice_llm import InvoiceLLM

invoice_router = APIRouter(prefix="/invoice")

class InvoiceTask:
    def __init__(self, llm: InvoiceLLM, pdf_bytes: bytes):
        self.id = str(uuid.uuid4())
        self.pdf_bytes = pdf_bytes
        self.llm = llm
        self.event = asyncio.Event()
        self.result: str | None = None

    async def invoke(self):
        try:
            self.result = await self.llm.request(self.pdf_bytes)
        except Exception as e:
            # кладём ошибку в JSON-строку, чтобы фронт мог её показать
            self.result = json.dumps({"error": str(e)}, ensure_ascii=False)
        self.event.set()


tasks: dict[str, InvoiceTask] = {}
llm = InvoiceLLM()


@invoice_router.post("/request")
async def start_invoice_extraction(file: UploadFile = File(...)):
    """
    Загружает PDF инвойса → запускает фоновую задачу анализа.
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Требуется PDF")

    pdf_bytes = await file.read()

    task = InvoiceTask(llm, pdf_bytes)
    tasks[task.id] = task

    asyncio.create_task(task.invoke())

    return {"id": task.id}


@invoice_router.get("/result/{task_id}")
async def get_invoice_result(task_id: str):
    """
    Проверяет статус задачи и возвращает результат.
    """

    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "status": task.event.is_set(),
        "result": task.result,
    }
