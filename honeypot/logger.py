import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models.attack import Attack
from backend.app.models.command_log import CommandLog


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

def log_command(session_id, ip, username, command, output):
    timestamp = datetime.now().isoformat()

    command_log = {
        "timestamp": timestamp,
        "session_id": session_id,
        "ip": ip,
        "username": username,
        "command": command,
        "output": output,
    }

    # Save raw command evidence
    with LOG_FILE.open("a") as file:
        file.write(json.dumps(command_log) + "\n")

    # Save to SQLite
    db = SessionLocal()

    try:
        db_command = CommandLog(
            timestamp=datetime.fromisoformat(timestamp),
            session_id=session_id,
            ip=ip,
            username=username,
            command=command,
            output=output,
        )

        db.add(db_command)
        db.commit()

    finally:
        db.close()


def log_command(session_id, ip, username, command, output):
    timestamp = datetime.now().isoformat()

    command_log = {
        "timestamp": timestamp,
        "session_id": session_id,
        "ip": ip,
        "username": username,
        "command": command,
        "output": output,
    }

    # Save raw command evidence
    with LOG_FILE.open("a") as file:
        file.write(json.dumps(command_log) + "\n")

    # Save to SQLite
    db = SessionLocal()

    try:
        db_command = CommandLog(
            timestamp=datetime.fromisoformat(timestamp),
            session_id=session_id,
            ip=ip,
            username=username,
            command=command,
            output=output,
        )

        db.add(db_command)
        db.commit()

    finally:
        db.close()
