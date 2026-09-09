import paramiko

from honeypot.logger import log_attack


class HoneypotServer(paramiko.ServerInterface):

    def __init__(self, ip):
        super().__init__()
        self.ip = ip
        self.username = None
        self.authenticated = False
        self.pty_requested = False

    def get_allowed_auths(self, username):
        return "password"

    def check_channel_request(self, kind, chanid):
        if kind == "session":
            return paramiko.OPEN_SUCCEEDED

        return paramiko.OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def check_auth_password(self, username, password):
        print("=" * 40)
        print("Login Attempt")
        print(f"Username : {username}")
        print(f"Password : {password}")
        print("=" * 40)

        log_attack(self.ip, username, password)

        self.username = username
        self.authenticated = True

        return paramiko.AUTH_SUCCESSFUL

    def check_channel_pty_request(
        self,
        channel,
        term,
        width,
        height,
        pixelwidth,
        pixelheight,
        modes,
    ):
        self.pty_requested = True

        print(
            f"PTY requested: term={term}, "
            f"size={width}x{height}"
        )

        return True

    def check_channel_shell_request(self, channel):
        return True
