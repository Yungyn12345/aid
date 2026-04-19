import mimetypes
from pathlib import Path

from flask import Flask
from sqlalchemy import inspect, text

from landing_app.config import Config
from landing_app.extensions import db
from landing_app.routes.admin import admin_bp
from landing_app.routes.main import main_bp


BASE_DIR = Path(__file__).resolve().parent.parent


def migrate_sqlite_leads_table() -> None:
    inspector = inspect(db.engine)
    if "leads" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("leads")}
    migrations = {
        "company": "ALTER TABLE leads ADD COLUMN company VARCHAR(180)",
        "score": "ALTER TABLE leads ADD COLUMN score INTEGER",
    }

    with db.engine.begin() as connection:
        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


def create_app(config_object: type[Config] = Config) -> Flask:
    mimetypes.add_type("application/javascript", ".js")

    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
        static_folder=str(BASE_DIR / "static"),
    )
    app.config.from_object(config_object)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        migrate_sqlite_leads_table()

    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp)
    return app
