import paramiko

from honeypot.logger import log_attack


class HoneypotServer(paramiko.ServerInterface):

    def __init__(self, ip):
        super().__init__()
        self.ip = ip

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

        return paramiko.AUTH_FAILED
