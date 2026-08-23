import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models.attack import Attack


BASE_DIR = Path(__file__).resolve().parents[1]

LOG_FILE = BASE_DIR / "logs" / "attacks.jsonl"
DATABASE_PATH = BASE_DIR / "database" / "honeypot.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine)


def log_attack(ip, username, password):
    timestamp = datetime.now().isoformat()

    attack = {
        "timestamp": timestamp,
        "ip": ip,
        "username": username,
        "password": password,
    }

    # Save raw evidence
    with LOG_FILE.open("a") as file:
        file.write(json.dumps(attack) + "\n")

    # Save to SQLite
    db = SessionLocal()

    try:
        db_attack = Attack(
            timestamp=datetime.fromisoformat(timestamp),
            ip=ip,
            username=username,
            password=password,
        )

        db.add(db_attack)
        db.commit()

    finally:
        db.close()