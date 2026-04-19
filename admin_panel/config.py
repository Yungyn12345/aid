import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.getenv("ADMIN_PANEL_SECRET_KEY", "change-me")
    USERNAME = os.getenv("ADMIN_PANEL_USERNAME", "admin")
    PASSWORD = os.getenv("ADMIN_PANEL_PASSWORD", "change-me")
    DATABASE_PATH = Path(
        os.getenv(
            "DATABASE_PATH",
            str(PROJECT_ROOT / "site" / "instance" / "site.sqlite3"),
        )
    )
