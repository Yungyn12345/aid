# packing_list_request.py
from __future__ import annotations

import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
import json

from external_api import PackingListLLM

packing_list_router = APIRouter(prefix="/packing_list")



class PackingListTask:
    def __init__(self, llm: PackingListLLM, pdf_bytes: bytes):
        self.id = str(uuid.uuid4())
        self.pdf_bytes = pdf_bytes
        self.llm = llm
        self.event = asyncio.Event()
        self.result: dict | None = None  # <- теперь dict

    async def invoke(self):
        try:
            raw = await self.llm.request(self.pdf_bytes)  # raw = строка JSON от LLM
            # гарантируем, что внутри у нас dict
            self.result = json.loads(raw)
        except Exception as e:
            self.result = {"error": str(e)}
        self.event.set()

tasks: dict[str, PackingListTask] = {}
llm = PackingListLLM()


@packing_list_router.post("/request")
async def start_packing_list_extraction(file: UploadFile = File(...)):
    """
    Загружает PDF упаковочного листа → запускает фоновую задачу анализа.
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Требуется PDF")

    pdf_bytes = await file.read()

    task = PackingListTask(llm, pdf_bytes)
    tasks[task.id] = task

    asyncio.create_task(task.invoke())

    return {"id": task.id}


@packing_list_router.get("/result/{task_id}")
async def get_packing_list_result(task_id: str):
    """
    Проверяет статус задачи и возвращает результат.
    """
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "status": task.event.is_set(),  # True, когда задача закончена
        "result": task.result,          # ЛИБО dict с PL, либо {"error": "..."}
    }

