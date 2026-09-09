import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models.attack import Attack
from backend.app.models.command_log import CommandLog
from backend.app.models.alert import Alert
from backend.app.models.ioc import IOC
from backend.app.services.detection_service import detect_command


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

    # Save raw attack evidence
    with LOG_FILE.open("a") as file:
        file.write(json.dumps(attack) + "\n")

    # Save attack to SQLite
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

    # Run detection engine
    detection = detect_command(command)

    # Use one database session for command, alert, and IOC records
    db = SessionLocal()

    try:
        # Save command
        db_command = CommandLog(
            timestamp=datetime.fromisoformat(timestamp),
            session_id=session_id,
            ip=ip,
            username=username,
            command=command,
            output=output,
        )

        db.add(db_command)

        if detection:
            # Save alert with MITRE ATT&CK mapping
            alert = Alert(
                timestamp=datetime.fromisoformat(timestamp),
                session_id=session_id,
                ip=ip,
                username=username,
                command=command,
                event_type=detection["event_type"],
                severity=detection["severity"],
                description=detection["description"],
                mitre_technique=detection.get("mitre_technique"),
                mitre_name=detection.get("mitre_name"),
            )

            db.add(alert)

            # Save extracted IOCs
            for ioc in detection.get("iocs", []):
                db_ioc = IOC(
                    timestamp=datetime.fromisoformat(timestamp),
                    session_id=session_id,
                    ip=ip,
                    ioc_type=ioc["type"],
                    value=ioc["value"],
                    source_command=command,
                )

                db.add(db_ioc)

        # Commit command, alert, and IOCs together
        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

    # Display detection in terminal
    if detection:
        print("\n🚨 DETECTION ALERT")
        print(f"Event    : {detection['event_type']}")
        print(f"Severity : {detection['severity']}")
        print(f"MITRE    : {detection['mitre_technique']} - {detection['mitre_name']}")
        print(f"Command  : {detection['command']}")
        print(f"Details  : {detection['description']}")

        if detection.get("iocs"):
            print("IOCs:")

            for ioc in detection["iocs"]:
                print(f"  {ioc['type']} : {ioc['value']}")

        print()