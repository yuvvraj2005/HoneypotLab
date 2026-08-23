from backend.app.core.database import SessionLocal
from backend.app.models.attack import Attack


def get_attacks(
    limit: int = 100,
    ip: str | None = None,
    username: str | None = None,
):
    db = SessionLocal()

    try:
        query = db.query(Attack)

        if ip:
            query = query.filter(Attack.ip == ip)

        if username:
            query = query.filter(Attack.username == username)

        attacks = (
            query
            .order_by(Attack.timestamp.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "timestamp": attack.timestamp,
                "ip": attack.ip,
                "username": attack.username,
                "password": "[REDACTED]",
            }
            for attack in attacks
        ]

    finally:
        db.close()


def get_attack_by_id(attack_id: int):
    db = SessionLocal()

    try:
        attack = (
            db.query(Attack)
            .filter(Attack.id == attack_id)
            .first()
        )

        if not attack:
            return None

        return {
            "timestamp": attack.timestamp,
            "ip": attack.ip,
            "username": attack.username,
            "password": "[REDACTED]",
        }

    finally:
        db.close()