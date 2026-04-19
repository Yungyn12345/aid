from alembic import op
import sqlalchemy as sa


revision = "0001_create_landing_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("company", sa.String(length=180), nullable=True),
        sa.Column("contact", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("utm_source", sa.String(length=120), nullable=True),
        sa.Column("utm_medium", sa.String(length=120), nullable=True),
        sa.Column("utm_campaign", sa.String(length=180), nullable=True),
        sa.Column("utm_content", sa.String(length=180), nullable=True),
        sa.Column("utm_term", sa.String(length=180), nullable=True),
        sa.Column("referrer", sa.String(length=500), nullable=True),
        sa.Column("landing_path", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_leads")),
    )
    op.create_index(op.f("ix_leads_id"), "leads", ["id"], unique=False)

    op.create_table(
        "cta_clicks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("target_url", sa.String(length=500), nullable=False),
        sa.Column("utm_source", sa.String(length=120), nullable=True),
        sa.Column("utm_medium", sa.String(length=120), nullable=True),
        sa.Column("utm_campaign", sa.String(length=180), nullable=True),
        sa.Column("utm_content", sa.String(length=180), nullable=True),
        sa.Column("utm_term", sa.String(length=180), nullable=True),
        sa.Column("referrer", sa.String(length=500), nullable=True),
        sa.Column("ip", sa.String(length=80), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cta_clicks")),
    )
    op.create_index(op.f("ix_cta_clicks_id"), "cta_clicks", ["id"], unique=False)

    op.create_table(
        "settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_settings")),
        sa.UniqueConstraint("key", name=op.f("uq_settings_key")),
    )
    op.create_index(op.f("ix_settings_id"), "settings", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_settings_id"), table_name="settings")
    op.drop_table("settings")
    op.drop_index(op.f("ix_cta_clicks_id"), table_name="cta_clicks")
    op.drop_table("cta_clicks")
    op.drop_index(op.f("ix_leads_id"), table_name="leads")
    op.drop_table("leads")
