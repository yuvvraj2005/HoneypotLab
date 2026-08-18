import json
from pathlib import Path
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.attack import Attack


DATABASE_URL = "sqlite:///./honeypot.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine)


LOG_FILE = Path(__file__).resolve().parents[2] / "logs" / "attacks.jsonl"


def migrate_logs():
    db = SessionLocal()

    with LOG_FILE.open("r") as file:
        for line in file:
            if not line.strip():
                continue

            data = json.loads(line)

            attack = Attack(
                timestamp=datetime.fromisoformat(data["timestamp"]),
                ip=data["ip"],
                username=data["username"],
                password=data["password"],
            )

            db.add(attack)

    db.commit()
    db.close()

    print("Logs migrated successfully.")


if __name__ == "__main__":
    migrate_logs()