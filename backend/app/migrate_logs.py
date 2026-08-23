import json
from datetime import datetime
from pathlib import Path

from app.core.database import SessionLocal
from app.models.attack import Attack


LOG_FILE = Path(__file__).resolve().parents[2] / "logs" / "attacks.jsonl"


def migrate_logs():
    db = SessionLocal()

    try:
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

        print("Logs migrated successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    migrate_logs()