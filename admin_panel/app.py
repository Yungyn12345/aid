import mimetypes

from flask import Flask, flash, redirect, render_template, url_for

from auth import require_auth
from config import Config
from storage import delete_lead, get_stats, list_leads


def create_app(config_object: type[Config] = Config) -> Flask:
    mimetypes.add_type("application/javascript", ".js")

    app = Flask(
        __name__,
        static_folder="static",
        static_url_path="/static",
        template_folder="templates",
    )
    app.config.from_object(config_object)

    @app.get("/")
    @app.get("/admin")
    @app.get("/admin/")
    @require_auth
    def dashboard():
        database_path = app.config["DATABASE_PATH"]
        return render_template(
            "dashboard.html",
            leads=list_leads(database_path),
            stats=get_stats(database_path),
        )

    @app.get("/admin/static/<path:filename>")
    def admin_static_compat(filename: str):
        return app.send_static_file(filename)

    @app.post("/delete/<int:lead_id>")
    @app.post("/admin/delete/<int:lead_id>")
    @require_auth
    def delete_lead_route(lead_id: int):
        deleted = delete_lead(app.config["DATABASE_PATH"], lead_id)
        flash("Заявка удалена." if deleted else "Заявка не найдена.")
        return redirect(url_for("dashboard"))

    return app


app = create_app()
