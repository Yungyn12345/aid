from functools import wraps

from flask import Blueprint, Response, current_app, render_template, request

from landing_app.models import Lead


admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def require_basic_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth = request.authorization
        expected_user = current_app.config["ADMIN_USERNAME"]
        expected_password = current_app.config["ADMIN_PASSWORD"]
        if not auth or auth.username != expected_user or auth.password != expected_password:
            return Response(
                "Authentication required",
                401,
                {"WWW-Authenticate": 'Basic realm="AIDDoc admin"'},
            )
        return view(*args, **kwargs)

    return wrapped


@admin_bp.get("/")
@require_basic_auth
def leads():
    items = Lead.query.order_by(Lead.created_at.desc()).all()
    return render_template("admin/leads.html", leads=items)
