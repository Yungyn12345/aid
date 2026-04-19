import mimetypes
from pathlib import Path

from flask import Flask

from landing_app.config import Config
from landing_app.extensions import db
from landing_app.routes.admin import admin_bp
from landing_app.routes.main import main_bp


BASE_DIR = Path(__file__).resolve().parent.parent


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

    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp)
    return app
