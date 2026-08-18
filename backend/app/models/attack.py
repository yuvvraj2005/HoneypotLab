from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Attack(Base):
    __tablename__ = "attacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    ip: Mapped[str] = mapped_column(String(45), nullable=False)

    username: Mapped[str] = mapped_column(String(255), nullable=False)

    password: Mapped[str] = mapped_column(String(255), nullable=False)