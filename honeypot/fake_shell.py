"""
fake_shell.py — Simulated Linux shell for the HoneypotLab deception environment.

SECURITY ISOLATION GUARANTEE
─────────────────────────────
• No real host commands are ever executed.
• No subprocess calls with attacker-controlled input.
• No eval / exec.
• The fake filesystem is a pure Python dict.
• sqlite3 simulation uses honeypot.fake_db — no real DB connection.
• The real host filesystem is never read or written by attacker commands.
"""

import posixpath
import uuid

from honeypot.fake_db import FakeDatabase
from honeypot.logger import log_command


# ─── Fake file system contents ────────────────────────────────────────────────
# These are DECEPTION artefacts – entirely synthetic.
# They look realistic to an attacker but contain no real secrets.

_FAKE_FILES = {
    # ── Top-level deception files ─────────────────────────────────────────────
    "/home/root/credentials.txt": (
        "# Server credentials (DO NOT SHARE)\n"
        "backup_admin:BackupAdmin@2026\n"
        "db_user:ProdDB_ReadOnly!\n"
        "monitor:Monitor@123\n"
        "deploy_key:DeployKey!Prod99\n"
    ),
    "/home/root/documents/notes.txt": (
        "System maintenance scheduled for Sunday.\n"
        "Backup server: 10.0.0.25\n"
        "Contact: sysadmin@acmecorp.io\n"
    ),
    "/home/root/scripts/backup.sh": (
        "#!/bin/bash\n"
        "set -e\n"
        "echo 'Starting backup...'\n"
        "rsync -avz /data/ backup@10.0.0.25:/backup/\n"
        "echo 'Done.'\n"
    ),
    "/home/root/.ssh/authorized_keys": (
        "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC+fakekey+for+deception "
        "admin@acmecorp.io\n"
    ),
    "/home/root/.bash_history": (
        "ls -la\n"
        "cat credentials.txt\n"
        "sqlite3 database/users.db\n"
        "cd database\n"
        "ls\n"
        "cat database/backup.sql\n"
    ),

    # ── Fake database directory ───────────────────────────────────────────────
    "/home/root/database/README.txt": (
        "Database storage directory.\n"
        "users.db     - Application user accounts\n"
        "customers.db - Customer and billing records\n"
        "backup.sql   - SQL dump from 2026-09-01\n"
        "\n"
        "Access: db_user / ProdDB_ReadOnly!\n"
        "Backup schedule: daily at 03:00 UTC\n"
    ),
    "/home/root/database/backup.sql": (
        "-- HoneypotLab DB backup\n"
        "-- Generated: 2026-09-01 03:00:01 UTC\n"
        "\n"
        "CREATE TABLE users (\n"
        "  id INTEGER PRIMARY KEY,\n"
        "  username TEXT NOT NULL,\n"
        "  email TEXT NOT NULL,\n"
        "  role TEXT NOT NULL,\n"
        "  status TEXT NOT NULL,\n"
        "  password_hash TEXT NOT NULL\n"
        ");\n"
        "\n"
        "INSERT INTO users VALUES(1,'alice','alice@acmecorp.io','admin','active','$2b$12$K5Xe1fakeHashForAlice000');\n"
        "INSERT INTO users VALUES(2,'bob','bob@acmecorp.io','editor','active','$2b$12$K5Xe1fakeHashForBob00000');\n"
        "INSERT INTO users VALUES(5,'root','root@localhost','superuser','active','$2b$12$K5Xe1fakeHashForRoot0000');\n"
        "\n"
        "CREATE TABLE customers (\n"
        "  id INTEGER PRIMARY KEY,\n"
        "  name TEXT,\n"
        "  email TEXT,\n"
        "  plan TEXT,\n"
        "  created_at TEXT\n"
        ");\n"
    ),

    # ── Fake database files (listed in dir but content served via FakeDatabase) ─
    "/home/root/database/users.db":     "[binary SQLite file – use sqlite3 to open]\n",
    "/home/root/database/customers.db": "[binary SQLite file – use sqlite3 to open]\n",
}

_FAKE_DIRECTORIES = {
    "/home",
    "/home/root",
    "/home/root/documents",
    "/home/root/backups",
    "/home/root/scripts",
    "/home/root/.ssh",
    "/home/root/database",
    "/home/root/database/config",
}

# Files the attacker can open with sqlite3 (maps to our fake DB names)
_SQLITE_DB_FILES = {"users.db", "customers.db"}


class FakeShell:

    def __init__(self, channel, ip, username):
        self.channel = channel
        self.ip = ip
        self.username = username
        self.session_id = str(uuid.uuid4())
        self.cwd = "/home/root"

        # Deep-copy the fake filesystem so per-session changes are isolated
        self.files = dict(_FAKE_FILES)
        self.directories = set(_FAKE_DIRECTORIES)

        # Active sqlite3 simulation (None when not in a DB shell)
        self._db_session: FakeDatabase | None = None
        self._db_prompt: str = "sqlite> "

    # ─────────────────────────────────────────────────────────────────────────
    # Main loop
    # ─────────────────────────────────────────────────────────────────────────

    def run(self):
        self.channel.send(
            "Welcome to Ubuntu 22.04.5 LTS\r\n"
            "Last login: Mon Sep 15 08:44:01 2026 from 10.0.0.5\r\n\r\n"
        )

        buffer = ""
        escape_sequence = False

        while True:
            prompt = self._db_prompt if self._db_session else f"root@server:{self.cwd}$ "
            self.channel.send(prompt)

            while True:
                data = self.channel.recv(1)

                if not data:
                    return

                char = data.decode("utf-8", errors="ignore")

                # Ctrl+D
                if char == "\x04":
                    if not buffer:
                        if self._db_session:
                            self._db_session = None
                            self.channel.send("\r\n")
                        else:
                            self.channel.send("\r\nlogout\r\n")
                            return
                    continue

                # Ctrl+C
                if char == "\x03":
                    self.channel.send("^C\r\n")
                    buffer = ""
                    if self._db_session:
                        self._db_session = None
                    break

                # Escape sequences (arrow keys etc.)
                if escape_sequence:
                    if char.isalpha() or char == "~":
                        escape_sequence = False
                    continue

                if char == "\x1b":
                    escape_sequence = True
                    continue

                # Enter
                if char in ("\r", "\n"):
                    self.channel.send("\r\n")
                    command = buffer.strip()
                    buffer = ""

                    if not command:
                        break

                    if self._db_session is not None:
                        output, should_exit = self._handle_db_input(command)
                    else:
                        output, should_exit = self.handle_command(command)
                        log_command(
                            self.session_id,
                            self.ip,
                            self.username,
                            command,
                            output,
                        )

                    if output:
                        self.channel.send(output.replace("\n", "\r\n"))

                    if should_exit:
                        return

                    break

                # Backspace
                if char in ("\x08", "\x7f"):
                    if buffer:
                        buffer = buffer[:-1]
                        self.channel.send("\b \b")
                    continue

                # Ignore other control chars
                if ord(char) < 32:
                    continue

                buffer += char
                self.channel.send(char)

    # ─────────────────────────────────────────────────────────────────────────
    # sqlite3 shell input handler
    # ─────────────────────────────────────────────────────────────────────────

    def _handle_db_input(self, statement: str) -> tuple[str, bool]:
        """Route input to the fake database engine."""
        result = self._db_session.execute(statement)

        if result == "__EXIT__":
            self._db_session = None
            return "", False

        # Log the SQL statement as a regular command for detection
        log_command(
            self.session_id,
            self.ip,
            self.username,
            statement,
            result or "",
        )

        return result, False

    # ─────────────────────────────────────────────────────────────────────────
    # Shell command dispatcher
    # ─────────────────────────────────────────────────────────────────────────

    def handle_command(self, command: str) -> tuple[str, bool]:
        parts = command.split()
        base = parts[0]

        if base == "whoami":
            return "root\n", False

        if base == "pwd":
            return f"{self.cwd}\n", False

        if base == "id":
            return "uid=0(root) gid=0(root) groups=0(root)\n", False

        if base == "uname":
            arg = parts[1] if len(parts) > 1 else ""
            if arg == "-a":
                return "Linux server 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux\n", False
            return "Linux\n", False

        if base == "hostname":
            return "server\n", False

        if base == "env":
            return (
                "USER=root\n"
                "HOME=/home/root\n"
                "SHELL=/bin/bash\n"
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n"
                "TERM=xterm-256color\n"
                "LANG=en_US.UTF-8\n"
            ), False

        if base == "history":
            return self.files.get("/home/root/.bash_history", ""), False

        if base == "echo":
            return " ".join(parts[1:]) + "\n", False

        if base == "ls":
            flags = [p for p in parts[1:] if p.startswith("-")]
            args  = [p for p in parts[1:] if not p.startswith("-")]
            target = self.resolve_path(args[0]) if args else self.cwd
            return self.list_directory(target, long="-l" in " ".join(flags) or "-la" in " ".join(flags)), False

        if base == "cd":
            return self.change_directory(parts[1] if len(parts) > 1 else "/home/root"), False

        if base == "cat":
            if len(parts) < 2:
                return "cat: missing operand\n", False
            return self.read_file(parts[1]), False

        if base == "find":
            return self._handle_find(parts), False

        if base == "sqlite3":
            return self._handle_sqlite3(parts), False

        if base == "file":
            if len(parts) < 2:
                return "file: missing operand\n", False
            target = self.resolve_path(parts[1])
            if target.endswith(".db"):
                return f"{parts[1]}: SQLite 3.x database, last written using SQLite version 3042000\n", False
            if target in self.files:
                return f"{parts[1]}: ASCII text\n", False
            return f"{parts[1]}: ERROR: No such file or directory\n", False

        if base == "help":
            return (
                "Available commands:\n"
                "  whoami   pwd    id       uname   hostname  env\n"
                "  ls       cd     cat      find    file      echo\n"
                "  history  sqlite3\n"
                "  help     clear  exit\n"
            ), False

        if base == "clear":
            return "\033[2J\033[H", False

        if base in ("exit", "logout", "quit"):
            return "logout\n", True

        return f"bash: {base}: command not found\n", False

    # ─────────────────────────────────────────────────────────────────────────
    # Command implementations
    # ─────────────────────────────────────────────────────────────────────────

    def _handle_sqlite3(self, parts: list[str]) -> tuple[str, bool]:
        """Enter the fake sqlite3 interactive shell for a .db file."""
        if len(parts) < 2:
            return "Usage: sqlite3 <database>\n", False

        db_arg = parts[1]
        db_name = posixpath.basename(db_arg)

        if db_name not in _SQLITE_DB_FILES:
            return f"SQLite version 3.42.0\nEnter \".help\" for usage hints.\n-- database {db_name} not found\n", False

        self._db_session = FakeDatabase(db_name)
        self._db_prompt = f"sqlite> "
        return (
            f"SQLite version 3.42.0 2023-11-01 11:23:50\n"
            f"Enter \".help\" for usage hints.\n"
            f"Connected to a transient in-memory database.\n"
            f"Use \".open FILENAME\" to reopen on a persistent database.\n"
        ), False

    def _handle_find(self, parts: list[str]) -> str:
        """Simulate find in the fake filesystem."""
        # find [path] [-name pattern]
        start = self.cwd
        name_filter = None

        i = 1
        while i < len(parts):
            if parts[i] == "-name" and i + 1 < len(parts):
                name_filter = parts[i + 1].replace("*", "")
                i += 2
            elif not parts[i].startswith("-"):
                start = self.resolve_path(parts[i])
                i += 1
            else:
                i += 1

        results = []

        for d in sorted(self.directories):
            if d.startswith(start):
                if name_filter is None or name_filter.lower() in d.lower():
                    results.append(d)

        for f in sorted(self.files):
            if f.startswith(start):
                if name_filter is None or name_filter.lower() in posixpath.basename(f).lower():
                    results.append(f)

        return "\n".join(results) + "\n" if results else ""

    # ─────────────────────────────────────────────────────────────────────────
    # Filesystem helpers
    # ─────────────────────────────────────────────────────────────────────────

    def resolve_path(self, path: str) -> str:
        if path == "~":
            return "/home/root"
        if path.startswith("~/"):
            path = "/home/root/" + path[2:]
        if path.startswith("/"):
            target = path
        else:
            target = posixpath.join(self.cwd, path)
        return posixpath.normpath(target)

    def list_directory(self, path: str = None, long: bool = False) -> str:
        target = path or self.cwd
        entries = {}
        prefix = target.rstrip("/") + "/"

        for d in self.directories:
            if d.startswith(prefix):
                remainder = d[len(prefix):]
                if remainder and "/" not in remainder:
                    entries[remainder] = "dir"

        for f in self.files:
            if f.startswith(prefix):
                remainder = f[len(prefix):]
                if remainder and "/" not in remainder:
                    entries[remainder] = "file"

        if not entries:
            return ""

        if long:
            lines = ["total " + str(len(entries) * 4)]
            for name, kind in sorted(entries.items()):
                if kind == "dir":
                    lines.append(f"drwxr-xr-x 2 root root 4096 Sep 15 08:00 {name}")
                else:
                    size = len(self.files.get(prefix + name, ""))
                    lines.append(f"-rw-r--r-- 1 root root {size:4d} Sep 15 08:00 {name}")
            return "\n".join(lines) + "\n"
        else:
            return "  ".join(sorted(entries.keys())) + "\n"

    def change_directory(self, path: str) -> str:
        target = self.resolve_path(path)
        if target in self.directories:
            self.cwd = target
            return ""
        return f"bash: cd: {path}: No such file or directory\n"

    def read_file(self, path: str) -> str:
        target = self.resolve_path(path)
        if target in self.files:
            content = self.files[target]
            # Binary placeholder for .db files
            if content.startswith("[binary"):
                return f"cat: {path}: binary or data file – use sqlite3 to open\n"
            return content
        return f"cat: {path}: No such file or directory\n"
