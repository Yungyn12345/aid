from __future__ import annotations
import uuid
import asyncio
import json
from fastapi import APIRouter, Request, HTTPException
from external_api import TNVED_API_ABC, OpenAITnvedLLM


class TnvedTask:
    def __init__(self, llm_api: TNVED_API_ABC, prompt: str):
        self.id = str(uuid.uuid4())
        self.prompt = prompt
        self.event = asyncio.Event()
        self.llm_api = llm_api
        self.result = ""

    async def invoke(self):
        try:
            self.result = await self.llm_api.request(self.prompt)
        except Exception as exc:
            self.result = json.dumps({"error": str(exc)}, ensure_ascii=False)
        self.event.set()

tnvedcode_router = APIRouter(prefix="/tnvedcode")
tasks: dict[str, TnvedTask] = {}
openai_llm = OpenAITnvedLLM()


@tnvedcode_router.post("/request")
async def start_tnved_request(request: Request):
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")

    task = TnvedTask(openai_llm, body_str)
    tasks[task.id] = task
    asyncio.create_task(task.invoke())
    return {"id": task.id}


@tnvedcode_router.get("/result/{id}")
async def get_tnved_request_result(id: str):
    if id not in tasks:
        raise HTTPException(
            status_code=404, detail="TNVED request if not found")

    task = tasks[id]
    data = {
        "status": task.event.is_set(),
        "result": task.result
    }
    return data
