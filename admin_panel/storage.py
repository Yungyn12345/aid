import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,
    company VARCHAR(180),
    phone VARCHAR(80) NOT NULL,
    email VARCHAR(180) NOT NULL,
    score INTEGER,
    message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'new'
)
"""


MISSING_COLUMNS = {
    "company": "ALTER TABLE leads ADD COLUMN company VARCHAR(180)",
    "score": "ALTER TABLE leads ADD COLUMN score INTEGER",
}


def normalize_database_path(database_path: str | Path) -> Path:
    return Path(database_path)


def get_connection(database_path: str | Path) -> sqlite3.Connection:
    normalized_path = normalize_database_path(database_path)
    normalized_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(normalized_path)
    connection.row_factory = sqlite3.Row
    return connection


def ensure_database(database_path: str | Path) -> None:
    with get_connection(database_path) as connection:
        connection.execute(SCHEMA)
        existing = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(leads)").fetchall()
        }
        for column_name, statement in MISSING_COLUMNS.items():
            if column_name not in existing:
                connection.execute(statement)
        connection.commit()


def list_leads(database_path: str | Path) -> list[dict[str, Any]]:
    ensure_database(database_path)
    with get_connection(database_path) as connection:
        rows = connection.execute(
            """
            SELECT id, name, company, phone, email, score, message, created_at, status
            FROM leads
            ORDER BY datetime(created_at) DESC, id DESC
            """
        ).fetchall()
        return [dict(row) for row in rows]


def delete_lead(database_path: str | Path, lead_id: int) -> bool:
    ensure_database(database_path)
    with get_connection(database_path) as connection:
        cursor = connection.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        connection.commit()
        return cursor.rowcount > 0


def get_stats(database_path: str | Path) -> dict[str, Any]:
    ensure_database(database_path)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    with get_connection(database_path) as connection:
        total = connection.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        new_count = connection.execute(
            "SELECT COUNT(*) FROM leads WHERE status = 'new'"
        ).fetchone()[0]
        scored = connection.execute(
            "SELECT AVG(score), COUNT(score) FROM leads WHERE score IS NOT NULL"
        ).fetchone()
        recent_count = connection.execute(
            "SELECT COUNT(*) FROM leads WHERE datetime(created_at) >= datetime(?)",
            (seven_days_ago.isoformat(),),
        ).fetchone()[0]
        companies_count = connection.execute(
            """
            SELECT COUNT(DISTINCT company)
            FROM leads
            WHERE company IS NOT NULL AND company != ''
            """
        ).fetchone()[0]

    return {
        "total": total,
        "new_count": new_count,
        "avg_score": round(scored[0], 1) if scored[0] is not None else None,
        "scored_count": scored[1],
        "recent_count": recent_count,
        "companies_count": companies_count,
    }
