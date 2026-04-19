from datetime import datetime, timezone

from landing_app.extensions import db


class Lead(db.Model):
    __tablename__ = "leads"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    company = db.Column(db.String(180), nullable=True)
    phone = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(180), nullable=False)
    score = db.Column(db.Integer, nullable=True)
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    status = db.Column(db.String(50), nullable=False, default="new")

    def __repr__(self) -> str:
        return f"<Lead id={self.id} status={self.status}>"
