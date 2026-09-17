import re

from backend.app.services.ioc_service import extract_iocs


RULES = [
    # ── Existing rules (preserved) ────────────────────────────────────────────
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

    # ── Database interaction rules ─────────────────────────────────────────────

    # Entering or discovering the fake database directory/files
    {
        "pattern": r"(cd|ls|find).*(database|\.db|backup\.sql)",
        "event_type": "DATABASE_DISCOVERY",
        "severity": "MEDIUM",
        "description": "Attacker discovered or navigated to the fake database environment.",
        "mitre_technique": "T1083",
        "mitre_name": "File and Directory Discovery",
    },
    # Launching sqlite3 against any .db file
    {
        "pattern": r"sqlite3\s+\S+\.db",
        "event_type": "DATABASE_ENUMERATION",
        "severity": "MEDIUM",
        "description": "Attacker launched a SQLite database client against a database file.",
        "mitre_technique": "T1005",
        "mitre_name": "Data from Local System",
    },
    # .tables or .schema – schema discovery inside fake sqlite3 shell
    {
        "pattern": r"\.(tables|schema|databases)\b",
        "event_type": "DATABASE_SCHEMA_DISCOVERY",
        "severity": "MEDIUM",
        "description": "Attacker queried database schema or table structure.",
        "mitre_technique": "T1005",
        "mitre_name": "Data from Local System",
    },
    # SELECT targeting credential-like columns
    {
        "pattern": r"SELECT\b.*\b(password|passwd|password_hash|credential|secret|token)\b",
        "event_type": "DATABASE_CREDENTIAL_ACCESS",
        "severity": "CRITICAL",
        "description": "Attacker queried credential-related database columns.",
        "mitre_technique": "T1555",
        "mitre_name": "Credentials from Password Stores",
    },
    # SELECT * or broad table dump
    {
        "pattern": r"SELECT\s+\*\s+FROM\b",
        "event_type": "DATABASE_ENUMERATION",
        "severity": "HIGH",
        "description": "Attacker attempted to dump an entire database table.",
        "mitre_technique": "T1005",
        "mitre_name": "Data from Local System",
    },
    # General SELECT (lower priority – evaluated after credential-specific rule)
    {
        "pattern": r"\bSELECT\b.+\bFROM\b",
        "event_type": "DATABASE_ENUMERATION",
        "severity": "MEDIUM",
        "description": "Attacker executed a database SELECT query.",
        "mitre_technique": "T1005",
        "mitre_name": "Data from Local System",
    },
    # INSERT / UPDATE – data modification attempt
    {
        "pattern": r"\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b",
        "event_type": "DATABASE_DATA_MODIFICATION",
        "severity": "HIGH",
        "description": "Attacker attempted to modify database records.",
        "mitre_technique": "T1565.001",
        "mitre_name": "Stored Data Manipulation",
    },
    # DROP TABLE / DELETE
    {
        "pattern": r"\b(DROP\s+(TABLE|DATABASE)|DELETE\s+FROM|TRUNCATE)\b",
        "event_type": "DATABASE_DELETION_ATTEMPT",
        "severity": "CRITICAL",
        "description": "Attacker attempted to delete or destroy database objects.",
        "mitre_technique": "T1485",
        "mitre_name": "Data Destruction",
    },
    # SQL injection indicators
    {
        "pattern": r"(UNION\s+SELECT|information_schema|OR\s+1=1|--\s*$|;\s*DROP)",
        "event_type": "SQL_INJECTION_ATTEMPT",
        "severity": "CRITICAL",
        "description": "Attacker attempted SQL injection.",
        "mitre_technique": "T1190",
        "mitre_name": "Exploit Public-Facing Application",
    },
    # cat of a .db or backup.sql file
    {
        "pattern": r"\b(cat|less|more|head|tail)\b.*(\.db|backup\.sql)",
        "event_type": "DATABASE_DISCOVERY",
        "severity": "MEDIUM",
        "description": "Attacker read a database or backup file.",
        "mitre_technique": "T1083",
        "mitre_name": "File and Directory Discovery",
    },
]


def detect_command(command: str):
    """
    Analyse a honeypot command and return the first matching detection event.

    Rules are evaluated in order; the first match wins.  This avoids
    duplicate alerts for a single command while ensuring the most specific
    rule (e.g. DATABASE_CREDENTIAL_ACCESS before DATABASE_ENUMERATION)
    fires when both would match.
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