import re

from backend.app.services.ioc_service import extract_iocs


RULES = [
    {
        "pattern": r"^(whoami|id|uname)(\s|$)",
        "event_type": "SYSTEM_RECONNAISSANCE",
        "severity": "LOW",
        "description": "Attacker queried system or user information.",
        "mitre_technique": "T1033",
        "mitre_name": "System Owner/User Discovery",
    },
    {
        "pattern": r"^(ls|find)(\s|$)",
        "event_type": "FILE_DISCOVERY",
        "severity": "LOW",
        "description": "Attacker attempted to discover files or directories.",
        "mitre_technique": "T1083",
        "mitre_name": "File and Directory Discovery",
    },
    {
        "pattern": r"\b(cat|less|more|head|tail)\b.*\b(credentials|password|passwd|shadow)\b",
        "event_type": "CREDENTIAL_ACCESS",
        "severity": "HIGH",
        "description": "Attacker attempted to access credential-related files.",
        "mitre_technique": "T1552.001",
        "mitre_name": "Credentials In Files",
    },
    {
        "pattern": r"\b(cat|less|more|head|tail)\b.*\.ssh/(id_rsa|id_ed25519)",
        "event_type": "SSH_KEY_ACCESS",
        "severity": "CRITICAL",
        "description": "Attacker attempted to access a private SSH key.",
        "mitre_technique": "T1552.004",
        "mitre_name": "Private Keys",
    },
    {
        "pattern": r"\b(wget|curl)\b",
        "event_type": "DOWNLOAD_ATTEMPT",
        "severity": "HIGH",
        "description": "Attacker attempted to download a remote resource.",
        "mitre_technique": "T1105",
        "mitre_name": "Ingress Tool Transfer",
    },
    {
        "pattern": r"^(sudo|su)(\s|$)",
        "event_type": "PRIVILEGE_ESCALATION",
        "severity": "HIGH",
        "description": "Attacker attempted privilege escalation.",
        "mitre_technique": "T1548.003",
        "mitre_name": "Sudo and Sudo Caching",
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
                "mitre_technique": rule["mitre_technique"],
                "mitre_name": rule["mitre_name"],
                "iocs": extract_iocs(command),
            }

    return None