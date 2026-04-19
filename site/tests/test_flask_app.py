from landing_app import create_app
from landing_app.config import Config
from landing_app.extensions import db
from landing_app.models import Lead


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


def test_index_renders_content():
    app = create_app(TestConfig)
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200
    assert "АИ Декларант".encode() in response.data
    assert "Заполнить декларацию".encode() in response.data


def test_submit_lead_saves_to_sqlite():
    app = create_app(TestConfig)
    client = app.test_client()

    response = client.post(
        "/lead",
        data={
            "name": "Иван",
            "company": "AIDDoc",
            "phone": "+79991234567",
            "email": "ivan@example.com",
            "score": "9",
            "message": "Нужна демонстрация",
        },
        headers={"Accept": "application/json"},
    )

    assert response.status_code == 201
    assert response.json["success"] is True

    with app.app_context():
        lead = db.session.get(Lead, response.json["id"])
        assert lead is not None
        assert lead.status == "new"
        assert lead.email == "ivan@example.com"
        assert lead.company == "AIDDoc"
        assert lead.score == 9
