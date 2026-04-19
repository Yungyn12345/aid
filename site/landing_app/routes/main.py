from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for

from landing_app.extensions import db
from landing_app.models import Lead


main_bp = Blueprint("main", __name__)


@main_bp.get("/")
def index():
    return render_template("index.html")


@main_bp.get("/health")
def health():
    return {"status": "ok"}


@main_bp.post("/lead")
def submit_lead():
    if request.form.get("website"):
        return redirect(url_for("main.index"))

    name = request.form.get("name", "").strip()
    company = request.form.get("company", "").strip()
    phone = request.form.get("phone", "").strip()
    email = request.form.get("email", "").strip()
    score_raw = request.form.get("score", "").strip()
    message = request.form.get("message", "").strip()
    score = None

    errors = []
    if len(name) < 2:
        errors.append("Укажите имя.")
    if len(phone) < 5:
        errors.append("Укажите телефон.")
    if "@" not in email or "." not in email:
        errors.append("Укажите корректный email.")
    if score_raw:
        try:
            score = int(score_raw)
            if score < 1 or score > 10:
                errors.append("Оценка проекта должна быть от 1 до 10.")
        except ValueError:
            errors.append("Оценка проекта должна быть числом.")

    wants_json = request.accept_mimetypes.best == "application/json"
    if errors:
        if wants_json:
            return jsonify({"success": False, "errors": errors}), 400
        for error in errors:
            flash(error, "error")
        return redirect(url_for("main.index", _anchor="contact"))

    lead = Lead(
        name=name,
        company=company or None,
        phone=phone,
        email=email,
        score=score,
        message=message or None,
    )
    db.session.add(lead)
    db.session.commit()

    if wants_json:
        return jsonify({"success": True, "id": lead.id}), 201

    flash("Заявка отправлена. Мы свяжемся с вами после обработки.", "success")
    return redirect(url_for("main.index", _anchor="contact"))
