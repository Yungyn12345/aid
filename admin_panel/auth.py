from functools import wraps

from flask import Response, current_app, request


def check_auth(username: str, password: str) -> bool:
    return (
        username == current_app.config["USERNAME"]
        and password == current_app.config["PASSWORD"]
    )


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return Response(
                "Authentication required",
                401,
                {"WWW-Authenticate": 'Basic realm="AIDDoc admin"'},
            )
        return view(*args, **kwargs)

    return wrapped
