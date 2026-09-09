import posixpath
import uuid

from honeypot.logger import log_command


class FakeShell:

    def __init__(self, channel, ip, username):
        self.channel = channel
        self.ip = ip
        self.username = username
        self.session_id = str(uuid.uuid4())
        self.cwd = "/home/root"

        self.files = {
            "/home/root/credentials.txt": (
                "backup_admin:BackupAdmin@2026\n"
                "db_user:ProdDB_ReadOnly!\n"
                "monitor:Monitor@123\n"
            ),
            "/home/root/documents/notes.txt": (
                "System maintenance scheduled for Sunday.\n"
                "Backup server: 10.0.0.25\n"
            ),
            "/home/root/scripts/backup.sh": (
                "#!/bin/bash\n"
                "echo 'Starting backup...'\n"
            ),
        }

        self.directories = {
            "/home",
            "/home/root",
            "/home/root/documents",
            "/home/root/backups",
            "/home/root/scripts",
            "/home/root/.ssh",
        }

    def run(self):
        self.channel.send(
            "Welcome to Ubuntu 22.04.5 LTS\r\n"
            "Last login: Thu Sep  8 12:00:00 2026\r\n\r\n"
        )

        buffer = ""
        escape_sequence = False

        while True:
            self.channel.send(f"root@server:{self.cwd}$ ")

            while True:
                data = self.channel.recv(1)

                if not data:
                    return

                char = data.decode("utf-8", errors="ignore")

                # Ctrl+D — close the session when no command is buffered.
                if char == "\x04":
                    if not buffer:
                        self.channel.send("\r\nlogout\r\n")
                        return
                    continue

                # Ctrl+C — cancel the current command.
                if char == "\x03":
                    self.channel.send("^C\r\n")
                    buffer = ""
                    break

                # Handle terminal escape sequences such as arrow keys.
                if escape_sequence:
                    if char.isalpha() or char == "~":
                        escape_sequence = False
                    continue

                if char == "\x1b":
                    escape_sequence = True
                    continue

                # Enter — process the command.
                if char in ("\r", "\n"):
                    self.channel.send("\r\n")

                    command = buffer.strip()
                    buffer = ""

                    if not command:
                        break

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

                # Backspace / Delete.
                if char in ("\x08", "\x7f"):
                    if buffer:
                        buffer = buffer[:-1]
                        self.channel.send("\b \b")
                    continue

                # Ignore other control characters.
                if ord(char) < 32:
                    continue

                buffer += char
                self.channel.send(char)

    def handle_command(self, command):
        parts = command.split()
        base_command = parts[0]

        if base_command == "whoami":
            return "root\n", False

        if base_command == "pwd":
            return f"{self.cwd}\n", False

        if base_command == "id":
            return (
                "uid=0(root) gid=0(root) groups=0(root)\n",
                False,
            )

        if base_command == "uname":
            return "Linux\n", False

        if base_command == "ls":
            return self.list_directory(), False

        if base_command == "cd":
            return self.change_directory(parts[1] if len(parts) > 1 else "/home/root"), False

        if base_command == "cat":
            if len(parts) < 2:
                return "cat: missing operand\n", False

            return self.read_file(parts[1]), False

        if base_command == "help":
            return (
                "Available commands: whoami, pwd, id, uname, ls, cd, cat, help, clear, exit\n",
                False,
            )

        if base_command == "clear":
            return "\033[2J\033[H", False

        if base_command == "exit":
            return "logout\n", True

        return f"bash: {base_command}: command not found\n", False

    def resolve_path(self, path):
        if path == "~":
            return "/home/root"

        if path.startswith("~/"):
            path = "/home/root/" + path[2:]

        if path.startswith("/"):
            target = path
        else:
            target = posixpath.join(self.cwd, path)

        return posixpath.normpath(target)

    def list_directory(self):
        entries = set()
        prefix = self.cwd.rstrip("/") + "/"

        for directory in self.directories:
            if directory.startswith(prefix):
                remainder = directory[len(prefix):]

                if remainder and "/" not in remainder:
                    entries.add(remainder)

        for file_path in self.files:
            if file_path.startswith(prefix):
                remainder = file_path[len(prefix):]

                if remainder and "/" not in remainder:
                    entries.add(remainder)

        return "  ".join(sorted(entries)) + "\n"

    def change_directory(self, path):
        target = self.resolve_path(path)

        if target in self.directories:
            self.cwd = target
            return ""

        return f"bash: cd: {path}: No such file or directory\n"

    def read_file(self, path):
        target = self.resolve_path(path)

        if target in self.files:
            return self.files[target]

        return f"cat: {path}: No such file or directory\n"

