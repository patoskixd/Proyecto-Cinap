from __future__ import annotations
import uuid, sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped
from app.frameworks_drivers.config.db import Base  

class TelegramAccountModel(Base):
    __tablename__ = "telegram_account"

    id: Mapped[uuid.UUID]         = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = sa.Column(UUID(as_uuid=True), sa.ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)

    telegram_user_id: Mapped[int] = sa.Column(sa.BigInteger, nullable=False)
    chat_id: Mapped[int]          = sa.Column(sa.BigInteger, nullable=False)
    telegram_username: Mapped[str | None] = sa.Column(sa.Text)

    creado_en  = sa.Column(sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False)
    actualizado_en = sa.Column(sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False)


    __table_args__ = (
        sa.UniqueConstraint("usuario_id", name="uq_tg_usuario"),
        sa.UniqueConstraint("telegram_user_id", name="uq_tg_user"),
        sa.Index("ix_telegram_account_telegram_user_id", "telegram_user_id"),
    )
