import asyncio
import json
import uuid
from fastapi import HTTPException, Request, APIRouter
import random
from pathlib import Path

HERE = Path(__file__).resolve().parent / "docs_json"

demo_router = APIRouter(prefix='/demo')

tasks = {}


class DemoTask:
    def __init__(self, filename: str):
        self.filename = filename
        self.id = str(uuid.uuid4())
        self.event = asyncio.Event()
        self.result = ''

    async def invoke(self, wait_time=None):
        if wait_time == None:
            wait_time = random.randint(5, 15)
        await asyncio.sleep(wait_time)

        try:
            with open(HERE / (self.filename + ".json"), "r", encoding="utf-8") as file:
                content = file.read()
                self.result = json.dumps(json.loads(content))

        except Exception as e:
            self.result = f"Не удалось найти {self.filename}"
        self.event.set()


@demo_router.get("/request/{name}")
async def request(name: str):
    task = DemoTask(name)
    tasks[task.id] = task
    asyncio.create_task(task.invoke())
    return {"id": task.id}


@demo_router.get("/fast-request/{name}")
async def fast_request(name: str):
    task = DemoTask(name)
    tasks[task.id] = task
    await task.invoke(wait_time=0)
    return {
        "status": True,
        "result": task.result
    }


@demo_router.get("/result/{id}")
async def get_result(id: str):
    if id not in tasks:
        raise HTTPException(
            status_code=404, detail="Demo request not found")

    task = tasks[id]
    data = {
        "status": task.event.is_set(),
        "result": task.result
    }
    return data
