import socket
import paramiko

from honeypot.server import HoneypotServer

HOST = "0.0.0.0"
PORT = 2222

host_key = paramiko.RSAKey(filename="keys/server.key")

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))
server.listen(5)

print(f"Listening on {HOST}:{PORT}")

while True:
    client, address = server.accept()

    print(f"New connection from {address}")

    transport = paramiko.Transport(client)
    transport.add_server_key(host_key)

    honeypot = HoneypotServer(address[0])

    transport.start_server(server=honeypot)

    channel = transport.accept(20)

    if channel is None:
        print("No channel opened.")
    else:
        print("Channel established.")

    transport.close()
