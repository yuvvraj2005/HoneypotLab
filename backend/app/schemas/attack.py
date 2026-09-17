from datetime import datetime

from pydantic import BaseModel


class AttackResponse(BaseModel):
    timestamp: datetime
    ip: str
    username: str
    # Exposed as password_hash in the API – never the plaintext or bcrypt hash.
    # The log_service always returns "[REDACTED]" for this field.
    password: str