from datetime import datetime

import bcrypt

from backend.app.core.database import SessionLocal
from backend.app.models.attack import Attack


def _hash_password(plaintext: str) -> str:
    """Return a bcrypt hash of the plaintext password (work factor 12)."""
    return bcrypt.hashpw(
        plaintext.encode("utf-8"),
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


def save_attack(ip: str, username: str, password: str, timestamp: str):
    """Persist an attack record with the password stored as a bcrypt hash."""
    db = SessionLocal()

    try:
        attack = Attack(
            timestamp=datetime.fromisoformat(timestamp),
            ip=ip,
            username=username,
            password=_hash_password(password),
        )

        db.add(attack)
        db.commit()

    finally:
        db.close()