import json
from datetime import datetime


def log_attack(ip, username, password):
    attack = {
        "timestamp": datetime.now().isoformat(),
        "ip": ip,
        "username": username,
        "password": password,
    }

    with open("logs/attacks.jsonl", "a") as file:
        file.write(json.dumps(attack) + "\n")
