import socket
import paramiko

from honeypot.fake_shell import FakeShell
from honeypot.server import HoneypotServer


HOST = "0.0.0.0"
PORT = 2222

host_key = paramiko.RSAKey(filename="keys/server.key")

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind((HOST, PORT))
server.listen(5)

print(f"Listening on {HOST}:{PORT}")

while True:
    client, address = server.accept()

    print(f"New connection from {address}")

    transport = paramiko.Transport(client)
    transport.add_server_key(host_key)

    honeypot = HoneypotServer(address[0])

    try:
        transport.start_server(server=honeypot)

        channel = transport.accept(20)

        if channel is None:
            print("No channel opened.")
            transport.close()
            continue

        print("Channel established.")

        # Wait until authentication and shell request are complete.
        while not honeypot.authenticated:
            if transport.is_active():
                continue

            break

        if honeypot.authenticated:
            shell = FakeShell(
                channel=channel,
                ip=honeypot.ip,
                username=honeypot.username,
            )

            shell.run()

    except Exception as error:
        print(f"Connection error: {error}")

    finally:
        transport.close()
        client.close()
