from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.command_log import CommandLog
from backend.app.models.alert import Alert


router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/{session_id}")
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    commands = (
        db.query(CommandLog)
        .filter(CommandLog.session_id == session_id)
        .order_by(CommandLog.timestamp.asc())
        .all()
    )

    alerts = (
        db.query(Alert)
        .filter(Alert.session_id == session_id)
        .order_by(Alert.timestamp.asc())
        .all()
    )

    if not commands and not alerts:
        return {
            "error": "Session not found"
        }

    return {
        "session_id": session_id,
        "ip": commands[0].ip if commands else alerts[0].ip,
        "username": commands[0].username if commands else alerts[0].username,
        "start_time": (
            commands[0].timestamp
            if commands
            else alerts[0].timestamp
        ),
        "end_time": (
            commands[-1].timestamp
            if commands
            else alerts[-1].timestamp
        ),
        "commands": [
            {
                "id": command.id,
                "timestamp": command.timestamp,
                "command": command.command,
                "output": command.output,
            }
            for command in commands
        ],
        "alerts": [
            {
                "id": alert.id,
                "timestamp": alert.timestamp,
                "event_type": alert.event_type,
                "severity": alert.severity,
                "command": alert.command,
                "description": alert.description,
            }
            for alert in alerts
        ],
    }