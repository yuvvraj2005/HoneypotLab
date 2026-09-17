"""
fake_db.py — Completely isolated fake database simulation for the HoneypotLab deception shell.

SECURITY ISOLATION GUARANTEE
─────────────────────────────
• No real files are read or written.
• No subprocesses are launched.
• No system calls with attacker input.
• The "database" is entirely in-memory Python dicts.
• Attacker SQL is parsed by a simple, hand-written tokenizer – never eval'd.
• The real HoneypotLab backend SQLite file is never touched.

All data is 100 % synthetic fiction.  Any resemblance to real persons,
companies, or credentials is coincidental.
"""

import re
from typing import Any


# ─── Synthetic dataset ────────────────────────────────────────────────────────

# users.db  →  "users" table
USERS_TABLE = [
    {"id": 1,  "username": "alice",   "email": "alice@acmecorp.io",    "role": "admin",   "status": "active",   "password_hash": "$2b$12$K5Xe1fakeHashForAlice000"},
    {"id": 2,  "username": "bob",     "email": "bob@acmecorp.io",      "role": "editor",  "status": "active",   "password_hash": "$2b$12$K5Xe1fakeHashForBob00000"},
    {"id": 3,  "username": "charlie", "email": "charlie@acmecorp.io",  "role": "viewer",  "status": "inactive", "password_hash": "$2b$12$K5Xe1fakeHashForCharlie0"},
    {"id": 4,  "username": "diana",   "email": "diana@acmecorp.io",    "role": "admin",   "status": "active",   "password_hash": "$2b$12$K5Xe1fakeHashForDiana000"},
    {"id": 5,  "username": "root",    "email": "root@localhost",       "role": "superuser","status": "active",  "password_hash": "$2b$12$K5Xe1fakeHashForRoot0000"},
]

# customers.db  →  "customers" and "transactions" tables
CUSTOMERS_TABLE = [
    {"id": 1, "name": "Globex Industries",  "email": "billing@globex.example",  "plan": "enterprise", "created_at": "2024-01-15"},
    {"id": 2, "name": "Initech Corp",       "email": "finance@initech.example", "plan": "pro",        "created_at": "2024-03-22"},
    {"id": 3, "name": "Umbrella Ltd",       "email": "ops@umbrella.example",    "plan": "starter",    "created_at": "2024-06-01"},
    {"id": 4, "name": "Soylent Dynamics",   "email": "admin@soylent.example",   "plan": "pro",        "created_at": "2024-07-19"},
]

TRANSACTIONS_TABLE = [
    {"id": 1, "customer_id": 1, "amount": 4999.00,  "status": "paid",    "timestamp": "2026-08-01T10:00:00"},
    {"id": 2, "customer_id": 2, "amount": 999.00,   "status": "paid",    "timestamp": "2026-08-05T14:30:00"},
    {"id": 3, "customer_id": 3, "amount": 49.00,    "status": "pending", "timestamp": "2026-09-01T09:15:00"},
    {"id": 4, "customer_id": 1, "amount": 4999.00,  "status": "paid",    "timestamp": "2026-09-01T10:00:00"},
    {"id": 5, "customer_id": 4, "amount": 999.00,   "status": "failed",  "timestamp": "2026-09-10T16:45:00"},
]

# Sessions table only in users.db (makes it look like a real app db)
SESSIONS_TABLE = [
    {"id": 1, "user_id": 1, "token": "tok_fake_a1b2c3d4e5f6", "expires_at": "2026-12-31T23:59:59", "ip": "10.0.0.5"},
    {"id": 2, "user_id": 2, "token": "tok_fake_9z8y7x6w5v4u", "expires_at": "2026-10-15T12:00:00", "ip": "10.0.0.12"},
]

# Map database file names to their available tables
DATABASE_CATALOG: dict[str, dict[str, list]] = {
    "users.db": {
        "users": USERS_TABLE,
        "sessions": SESSIONS_TABLE,
    },
    "customers.db": {
        "customers": CUSTOMERS_TABLE,
        "transactions": TRANSACTIONS_TABLE,
    },
}

# Schemas (column names) per table
TABLE_SCHEMAS: dict[str, list[str]] = {
    "users":        list(USERS_TABLE[0].keys()),
    "sessions":     list(SESSIONS_TABLE[0].keys()),
    "customers":    list(CUSTOMERS_TABLE[0].keys()),
    "transactions": list(TRANSACTIONS_TABLE[0].keys()),
}


# ─── In-memory mutable state ──────────────────────────────────────────────────
# Each FakeDatabase session gets its own copy so modifications don't persist
# between attacker sessions, and never touch any real file.

def _fresh_state() -> dict[str, dict[str, list]]:
    import copy
    return copy.deepcopy(DATABASE_CATALOG)


# ─── Simple SQL tokeniser helpers ────────────────────────────────────────────

def _split_sql(sql: str) -> list[str]:
    """Very naive whitespace/comma tokeniser for the fake SQL parser."""
    return re.split(r"[\s,]+", sql.strip().rstrip(";"))


def _extract_table_name(tokens: list[str], keyword: str) -> str | None:
    """Return the token immediately after `keyword` (case-insensitive)."""
    upper = [t.upper() for t in tokens]
    try:
        idx = upper.index(keyword.upper())
        return tokens[idx + 1] if idx + 1 < len(tokens) else None
    except ValueError:
        return None


def _format_table(rows: list[dict], columns: list[str]) -> str:
    """Format a list of row dicts as a simple ASCII table."""
    if not rows:
        return "(no rows)\n"

    # Build rows using only requested columns (if subset) else all
    col_widths = {col: len(col) for col in columns}
    for row in rows:
        for col in columns:
            col_widths[col] = max(col_widths[col], len(str(row.get(col, ""))))

    sep = "+" + "+".join("-" * (w + 2) for w in col_widths.values()) + "+"
    header = "|" + "|".join(f" {col:<{col_widths[col]}} " for col in columns) + "|"

    lines = [sep, header, sep]
    for row in rows:
        line = "|" + "|".join(f" {str(row.get(col, '')):<{col_widths[col]}} " for col in columns) + "|"
        lines.append(line)
    lines.append(sep)
    return "\n".join(lines) + "\n"


# ─── FakeDatabase class ───────────────────────────────────────────────────────

class FakeDatabase:
    """
    Simulated sqlite3-like interactive shell for a single fake database file.

    Instance state is isolated per session – modifications (INSERT/UPDATE/DELETE)
    affect only the in-memory copy and are discarded when the session ends.
    """

    def __init__(self, db_name: str):
        self.db_name = db_name
        # Deep-copy so each session is independent
        if db_name in DATABASE_CATALOG:
            import copy
            self.tables: dict[str, list[dict]] = copy.deepcopy(DATABASE_CATALOG[db_name])
        else:
            self.tables = {}

    # ── Public interface ──────────────────────────────────────────────────────

    def execute(self, statement: str) -> str:
        """
        Execute a fake SQL statement and return the output string.
        Never uses subprocess, eval, exec, or shell=True.
        """
        stmt = statement.strip().rstrip(";")

        if not stmt:
            return ""

        upper = stmt.upper().lstrip()

        # Meta-commands
        if upper.startswith(".TABLES"):
            return self._dot_tables()
        if upper.startswith(".SCHEMA"):
            return self._dot_schema(stmt)
        if upper.startswith(".DATABASES"):
            return f"main  {self.db_name}\n"
        if upper.startswith(".QUIT") or upper.startswith(".EXIT"):
            return "__EXIT__"
        if upper.startswith(".HELP"):
            return self._dot_help()

        # SQL statements
        if upper.startswith("SELECT"):
            return self._handle_select(stmt)
        if upper.startswith("INSERT"):
            return self._handle_insert(stmt)
        if upper.startswith("UPDATE"):
            return self._handle_update(stmt)
        if upper.startswith("DELETE"):
            return self._handle_delete(stmt)
        if upper.startswith("DROP"):
            return self._handle_drop(stmt)

        return f"Error: near \"{stmt.split()[0]}\": syntax error\n"

    # ── Meta-commands ─────────────────────────────────────────────────────────

    def _dot_help(self) -> str:
        return (
            ".databases           List names and files of attached databases\n"
            ".quit                Exit this program\n"
            ".schema ?TABLE?      Show CREATE statements\n"
            ".tables              List names of tables\n"
        )

    def _dot_tables(self) -> str:
        return "  ".join(sorted(self.tables.keys())) + "\n"

    def _dot_schema(self, stmt: str) -> str:
        parts = stmt.split()
        if len(parts) >= 2:
            table = parts[1].lower()
            if table in self.tables:
                cols = TABLE_SCHEMAS.get(table, list(self.tables[table][0].keys()) if self.tables[table] else [])
                col_defs = ",\n  ".join(f"{c} TEXT" for c in cols)
                return f"CREATE TABLE {table} (\n  {col_defs}\n);\n"
            return f"Error: no such table: {table}\n"
        # All tables
        result = []
        for tname, rows in self.tables.items():
            cols = TABLE_SCHEMAS.get(tname, list(rows[0].keys()) if rows else [])
            col_defs = ",\n  ".join(f"{c} TEXT" for c in cols)
            result.append(f"CREATE TABLE {tname} (\n  {col_defs}\n);")
        return "\n".join(result) + "\n"

    # ── SELECT ────────────────────────────────────────────────────────────────

    def _handle_select(self, stmt: str) -> str:
        # Quick safety check – refuse anything that looks like real system access
        if re.search(r"(information_schema|sqlite_master|pragma|attach)", stmt, re.IGNORECASE):
            return "Error: access denied\n"

        # Extract table name from "FROM <table>"
        m = re.search(r"\bFROM\s+(\w+)", stmt, re.IGNORECASE)
        if not m:
            return "Error: no FROM clause\n"

        table = m.group(1).lower()
        if table not in self.tables:
            return f"Error: no such table: {table}\n"

        rows = list(self.tables[table])

        # Apply simple WHERE <col> = '<val>' or WHERE <col> = <val>
        where_m = re.search(r"\bWHERE\s+(\w+)\s*=\s*['\"]?([^'\";\s]+)['\"]?", stmt, re.IGNORECASE)
        if where_m:
            col, val = where_m.group(1).lower(), where_m.group(2)
            rows = [r for r in rows if str(r.get(col, "")).lower() == val.lower()]

        # Determine requested columns
        col_part = re.search(r"SELECT\s+(.+?)\s+FROM", stmt, re.IGNORECASE)
        all_cols = TABLE_SCHEMAS.get(table, list(rows[0].keys()) if rows else [])
        if col_part:
            raw = col_part.group(1).strip()
            if raw == "*":
                cols = all_cols
            else:
                cols = [c.strip().lower() for c in raw.split(",")]
                # Validate column names
                invalid = [c for c in cols if c not in all_cols]
                if invalid:
                    return f"Error: no such column: {invalid[0]}\n"
        else:
            cols = all_cols

        return _format_table(rows, cols)

    # ── INSERT ────────────────────────────────────────────────────────────────

    def _handle_insert(self, stmt: str) -> str:
        m = re.search(r"INSERT\s+INTO\s+(\w+)", stmt, re.IGNORECASE)
        if not m:
            return "Error: syntax error in INSERT\n"
        table = m.group(1).lower()
        if table not in self.tables:
            return f"Error: no such table: {table}\n"
        # We accept the statement but store a placeholder row
        new_id = max((r.get("id", 0) for r in self.tables[table]), default=0) + 1
        self.tables[table].append({"id": new_id, "_note": "[synthetic inserted row]"})
        return f"-- 1 row inserted into {table} (id={new_id})\n"

    # ── UPDATE ────────────────────────────────────────────────────────────────

    def _handle_update(self, stmt: str) -> str:
        m = re.search(r"UPDATE\s+(\w+)\s+SET", stmt, re.IGNORECASE)
        if not m:
            return "Error: syntax error in UPDATE\n"
        table = m.group(1).lower()
        if table not in self.tables:
            return f"Error: no such table: {table}\n"
        return f"-- 1 row updated in {table}\n"

    # ── DELETE ────────────────────────────────────────────────────────────────

    def _handle_delete(self, stmt: str) -> str:
        m = re.search(r"DELETE\s+FROM\s+(\w+)", stmt, re.IGNORECASE)
        if not m:
            return "Error: syntax error in DELETE\n"
        table = m.group(1).lower()
        if table not in self.tables:
            return f"Error: no such table: {table}\n"
        return f"-- rows deleted from {table}\n"

    # ── DROP ──────────────────────────────────────────────────────────────────

    def _handle_drop(self, stmt: str) -> str:
        m = re.search(r"DROP\s+TABLE\s+(\w+)", stmt, re.IGNORECASE)
        if not m:
            return "Error: syntax error in DROP\n"
        table = m.group(1).lower()
        if table in self.tables:
            self.tables.pop(table)
            return f"-- table {table} dropped\n"
        return f"Error: no such table: {table}\n"
