import re

from backend.app.services.ioc_service import extract_iocs


RULES = [
    {
        "pattern": r"^(whoami|id|uname)(\s|$)",
        "event_type": "SYSTEM_RECONNAISSANCE",
        "severity": "LOW",
        "description": "Attacker queried system or user information.",
    },
    {
        "pattern": r"^(ls|find)(\s|$)",
        "event_type": "FILE_DISCOVERY",
        "severity": "LOW",
        "description": "Attacker attempted to discover files or directories.",
    },
    {
        "pattern": r"\b(cat|less|more|head|tail)\b.*\b(credentials|password|passwd|shadow)\b",
        "event_type": "CREDENTIAL_ACCESS",
        "severity": "HIGH",
        "description": "Attacker attempted to access credential-related files.",
    },
    {
        "pattern": r"\b(cat|less|more|head|tail)\b.*\.ssh/(id_rsa|id_ed25519)",
        "event_type": "SSH_KEY_ACCESS",
        "severity": "CRITICAL",
        "description": "Attacker attempted to access a private SSH key.",
    },
    {
        "pattern": r"\b(wget|curl)\b",
        "event_type": "DOWNLOAD_ATTEMPT",
        "severity": "HIGH",
        "description": "Attacker attempted to download a remote resource.",
    },
    {
        "pattern": r"^(sudo|su)(\s|$)",
        "event_type": "PRIVILEGE_ESCALATION",
        "severity": "HIGH",
        "description": "Attacker attempted privilege escalation.",
    },
]


def detect_command(command: str):
    """
    Analyze a honeypot command and return a detection event.
    """

    command = command.strip()

    if not command:
        return None

    for rule in RULES:
        if re.search(rule["pattern"], command, re.IGNORECASE):
            return {
                "detected": True,
                "event_type": rule["event_type"],
                "severity": rule["severity"],
                "description": rule["description"],
                "command": command,
                "iocs": extract_iocs(command),
            }

    return None