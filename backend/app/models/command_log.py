from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class CommandLog(Base):
    __tablename__ = "command_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    ip: Mapped[str] = mapped_column(String(45), nullable=False)

    username: Mapped[str] = mapped_column(String(255), nullable=False)

    command: Mapped[str] = mapped_column(Text, nullable=False)

    output: Mapped[str] = mapped_column(Text, nullable=False)
