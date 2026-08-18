from datetime import datetime

from pydantic import BaseModel


class AttackResponse(BaseModel):
    timestamp: datetime
    ip: str
    username: str
    password: str