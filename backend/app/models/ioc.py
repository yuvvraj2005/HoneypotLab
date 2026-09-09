from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class IOC(Base):
    __tablename__ = "iocs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    session_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    ip: Mapped[str] = mapped_column(
        String(45),
        nullable=False,
    )

    ioc_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    value: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
    )

    source_command: Mapped[str] = mapped_column(
        String(4096),
        nullable=False,
    )