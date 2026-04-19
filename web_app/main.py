import mimetypes
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from tnved_request import tnvedcode_router
from agreement_request import agreement_router
from invoice_request import invoice_router
from packing_list_request import packing_list_router
from cmr_request import cmr_router
from demo_api import demo_router

APP_ROOT_PATH = (os.getenv("APP_ROOT_PATH", "") or "").rstrip("/")
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = (BASE_DIR / "front" / "static").resolve()


class StaticPrefixCompatMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            path = scope.get("path", "")
            prefixes = ["/static/"]
            if APP_ROOT_PATH:
                prefixes.append(f"{APP_ROOT_PATH}/static/")

            for prefix in prefixes:
                if path.startswith(prefix):
                    relative_path = path[len(prefix):]
                    file_path = (STATIC_DIR / relative_path).resolve()
                    if STATIC_DIR in file_path.parents and file_path.is_file():
                        await FileResponse(file_path)(scope, receive, send)
                        return

        await self.app(scope, receive, send)

app = FastAPI(root_path=APP_ROOT_PATH)
mimetypes.add_type("application/javascript", ".js")
app.add_middleware(StaticPrefixCompatMiddleware)
app.include_router(tnvedcode_router)
app.include_router(agreement_router)
app.include_router(invoice_router)
app.include_router(packing_list_router)
app.include_router(cmr_router)
app.include_router(demo_router)

templates = Jinja2Templates(directory="front")
app.mount("/static", StaticFiles(directory="front/static"), name="static")


@app.get("/")
def index(request: Request):
    root_path = (request.scope.get("root_path") or APP_ROOT_PATH or "").rstrip("/")
    static_prefix = f"{root_path}/static" if root_path else "/static"
    return templates.TemplateResponse(
        "html/indexprogect.html",
        {
            "request": request,
            "app_root": root_path,
            "static_prefix": static_prefix,
        },
    )
