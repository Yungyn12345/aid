# cmr_request.py
from __future__ import annotations

import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
import json

from external_api.openai_cmr_llm import CmrLLM

cmr_router = APIRouter(prefix="/cmr")


class CmrTask:
    def __init__(self, llm: CmrLLM, pdf_bytes: bytes):
        self.id = str(uuid.uuid4())
        self.pdf_bytes = pdf_bytes
        self.llm = llm
        self.event = asyncio.Event()
        self.result: dict | None = None

    async def invoke(self):
        try:
            raw = await self.llm.request(self.pdf_bytes)  # строка JSON
            self.result = json.loads(raw)
        except Exception as e:
            self.result = {"error": str(e)}
        self.event.set()


tasks: dict[str, CmrTask] = {}
llm = CmrLLM()


@cmr_router.post("/request")
async def start_cmr_extraction(file: UploadFile = File(...)):
    """
    Загружает PDF CMR → запускает фоновую задачу анализа.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Требуется PDF")

    pdf_bytes = await file.read()
    task = CmrTask(llm, pdf_bytes)
    tasks[task.id] = task

    asyncio.create_task(task.invoke())
    return {"id": task.id}


@cmr_router.get("/result/{task_id}")
async def get_cmr_result(task_id: str):
    """
    Проверяет статус задачи и возвращает результат.
    """
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "status": task.event.is_set(),
        "result": task.result,  # dict или {"error": "..."}
    }
