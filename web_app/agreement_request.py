from __future__ import annotations
import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
import json
from external_api.openai_agreement_llm import AgreementLLM

agreement_router = APIRouter(prefix="/agreement")


class AgreementTask:
    def __init__(self, llm: AgreementLLM, pdf_bytes: bytes):
        self.id = str(uuid.uuid4())
        self.pdf_bytes = pdf_bytes
        self.llm = llm
        self.event = asyncio.Event()
        self.result = None

    async def invoke(self):
        try:
            self.result = await self.llm.request(self.pdf_bytes)
        except Exception as e:
            self.result = json.dumps({"error": str(e)})
        self.event.set()


tasks: dict[str, AgreementTask] = {}
llm = AgreementLLM()


@agreement_router.post("/request")
async def start_agreement_extraction(file: UploadFile = File(...)):
    """
    Загружает PDF договора → запускает фоновую задачу анализа.
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Требуется PDF")

    pdf_bytes = await file.read()

    task = AgreementTask(llm, pdf_bytes)
    tasks[task.id] = task

    asyncio.create_task(task.invoke())

    return {"id": task.id}


@agreement_router.get("/result/{task_id}")
async def get_agreement_result(task_id: str):
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
