import json
from pathlib import Path


LOG_FILE = Path(__file__).resolve().parents[3] / "logs" / "attacks.jsonl"


def get_attacks():
    attacks = []

    if not LOG_FILE.exists():
        return attacks

    with LOG_FILE.open("r") as file:
        for line in file:
            if line.strip():
                attack = json.loads(line)

                attack["password"] = "[REDACTED]"

                attacks.append(attack)

    return attacks