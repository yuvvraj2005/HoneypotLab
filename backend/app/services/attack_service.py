from datetime import datetime

from backend.app.core.database import SessionLocal
from backend.app.models.attack import Attack


def save_attack(ip: str, username: str, password: str, timestamp: str):
    db = SessionLocal()

    try:
        attack = Attack(
            timestamp=datetime.fromisoformat(timestamp),
            ip=ip,
            username=username,
            password=password,
        )

        db.add(attack)
        db.commit()

    finally:
        db.close()