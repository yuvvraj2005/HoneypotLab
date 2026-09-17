# HoneypotLab

**SSH Honeypot + SOC Monitoring Dashboard**

HoneypotLab is an authorized cybersecurity lab that deploys a realistic fake Linux
environment to attract, deceive, and log attacker behaviour.  A FastAPI backend stores
all captured data and a React/TypeScript SOC dashboard visualises it in real time.

---

## Architecture

```
HoneypotLab/
├── backend/          FastAPI + SQLAlchemy (deployed on Render)
│   └── app/
│       ├── api/routes/
│       ├── core/database.py
│       ├── models/
│       ├── services/
│       └── main.py
├── database/         SQLite file (gitignored; created automatically on startup)
│   └── .gitkeep
├── frontend/         React + TypeScript (deployed on Vercel)
├── honeypot/         Paramiko SSH honeypot
│   ├── fake_shell.py
│   ├── fake_db.py    ← isolated fake database simulation
│   ├── logger.py
│   └── server.py
├── keys/             RSA host key (gitignored)
├── logs/             JSONL event logs (gitignored)
└── requirements.txt
```

---

## Running the Honeypot

```bash
# Generate an RSA host key (first time only)
ssh-keygen -t rsa -b 2048 -f keys/server.key -N ""

# Start listening on port 2222
python -m honeypot.ssh_honeypot
```

Test with:
```bash
ssh -p 2222 root@127.0.0.1
```

Every connection is accepted and placed in the fake shell.

---

## Running the FastAPI Backend

```bash
pip install -r requirements.txt

# The lifespan creates the database/ directory and all tables automatically.
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The database is initialised on every startup via FastAPI `lifespan`.  No manual
`python init_db.py` step is required.

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend connects to `http://127.0.0.1:8000` (dev) or the Render URL (production).

---

## Credential Hashing

Captured attacker passwords are **never** stored in plaintext.

| Stage                    | Value stored                        |
|--------------------------|-------------------------------------|
| SSH authentication event | password passed to `log_attack()`   |
| `log_attack()`           | bcrypt hash (work factor 12, random salt) |
| SQLite `attacks.password`| `$2b$12$…` bcrypt hash              |
| API response             | `"[REDACTED]"` — hash is never exposed |
| Log file                 | `"[CAPTURED]"` — no plaintext       |
| Frontend display         | `[REDACTED]`                        |

bcrypt is already a project dependency (`bcrypt==5.0.0`).  Each hash includes its own
random salt, so two identical passwords produce different hashes.

Verification (for analysis purposes):
```python
import bcrypt
bcrypt.checkpw(b"TestPassword123!", stored_hash.encode())
```

---

## Fake Database / Deception Environment

When an attacker navigates to `/home/root/database/` they find:

```
users.db        ← fake SQLite database (in-memory simulation)
customers.db    ← fake SQLite database (in-memory simulation)
backup.sql      ← fake SQL dump with synthetic schema
README.txt      ← plausible instructions
```

### Opening a fake database

```
root@server:/home/root/database$ sqlite3 users.db
SQLite version 3.42.0
sqlite> .tables
sessions  users
sqlite> SELECT * FROM users;
+----+----------+---------------------+-----------+--------+---------------------------+
| id | username | email               | role      | status | password_hash             |
+----+----------+---------------------+-----------+--------+---------------------------+
| 1  | alice    | alice@acmecorp.io   | admin     | active | $2b$12$K5Xe1fakeHashFor…  |
…
sqlite> .quit
```

**Security isolation:**
- `fake_db.py` is a pure Python in-memory simulation.
- No subprocess is launched. No `eval`, no `exec`, no `shell=True`.
- The real `database/honeypot.db` is never accessed by attacker commands.
- Session state is discarded when the attacker disconnects.
- All data is entirely synthetic fiction.

---

## Database Attack Detection

The detection engine (`detection_service.py`) fires alerts on:

| Event Type                  | Severity | Trigger                                  | MITRE        |
|-----------------------------|----------|------------------------------------------|--------------|
| `DATABASE_DISCOVERY`        | MEDIUM   | `cd`/`ls`/`cat` on `.db` or backup file | T1083        |
| `DATABASE_ENUMERATION`      | MEDIUM–HIGH | `sqlite3 file.db`, `SELECT * FROM`    | T1005        |
| `DATABASE_SCHEMA_DISCOVERY` | MEDIUM   | `.tables`, `.schema`                     | T1005        |
| `DATABASE_CREDENTIAL_ACCESS`| CRITICAL | `SELECT … password …`                   | T1555        |
| `DATABASE_DATA_MODIFICATION`| HIGH     | `INSERT INTO`, `UPDATE … SET`            | T1565.001    |
| `DATABASE_DELETION_ATTEMPT` | CRITICAL | `DROP TABLE`, `DELETE FROM`              | T1485        |
| `SQL_INJECTION_ATTEMPT`     | CRITICAL | `UNION SELECT`, `OR 1=1`, etc.           | T1190        |

Existing rules are preserved:

| Event Type              | Severity | MITRE      |
|-------------------------|----------|------------|
| `SYSTEM_RECONNAISSANCE` | LOW      | T1033      |
| `FILE_DISCOVERY`        | LOW      | T1083      |
| `CREDENTIAL_ACCESS`     | HIGH     | T1552.001  |
| `SSH_KEY_ACCESS`        | CRITICAL | T1552.004  |
| `DOWNLOAD_ATTEMPT`      | HIGH     | T1105      |
| `PRIVILEGE_ESCALATION`  | HIGH     | T1548.003  |

---

## API Endpoints

| Method | Path                            | Description                         |
|--------|---------------------------------|-------------------------------------|
| GET    | `/health`                       | Service health check                |
| GET    | `/attacks`                      | List attack attempts                |
| GET    | `/attacks/{id}`                 | Single attack detail                |
| GET    | `/stats`                        | Aggregate statistics                |
| GET    | `/stats/timeline`               | Daily attack counts                 |
| GET    | `/alerts`                       | Security alerts                     |
| GET    | `/alerts/{id}`                  | Single alert detail                 |
| GET    | `/sessions/{session_id}`        | Session investigation               |
| GET    | `/iocs`                         | Indicators of Compromise            |
| GET    | `/iocs/{id}`                    | Single IOC                          |
| GET    | `/integration/security-summary` | Dashboard summary card              |

---

## Render Deployment

**URL:** https://honeypotlab.onrender.com

**Start command:**
```
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

**Database:** The `database/honeypot.db` SQLite file is **not** committed to Git.
The FastAPI `lifespan` creates the `database/` directory and all required tables
automatically on every fresh startup.

> ⚠️ **SQLite on Render limitation:** Render's free tier uses an ephemeral filesystem.
> Data written to `database/honeypot.db` during a deployment will be lost when
> the service restarts or redeploys.  For persistent data, configure a Render
> Persistent Disk or migrate to PostgreSQL.

---

## Vercel Deployment

**URL:** https://honeypot-lab-three.vercel.app/

The frontend is a static React/TypeScript SPA.  It connects to the Render backend URL.

---

## Database Initialization

```python
# backend/app/main.py  (lifespan)
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
import backend.app.models.attack       # registers "attacks"
import backend.app.models.command_log  # registers "command_logs"
import backend.app.models.alert        # registers "alerts"
import backend.app.models.ioc          # registers "iocs"
Base.metadata.create_all(bind=engine)  # idempotent – existing tables untouched
```

Tables created on a fresh deployment:

| Table          | Key columns                                                  |
|----------------|--------------------------------------------------------------|
| `attacks`      | id, timestamp, ip, username, password (bcrypt hash)          |
| `command_logs` | id, timestamp, session_id, ip, username, command, output     |
| `alerts`       | id, timestamp, session_id, ip, username, command, event_type, severity, description, mitre_technique, mitre_name |
| `iocs`         | id, timestamp, session_id, ip, ioc_type, value, source_command |

---

## Security Isolation

The honeypot is a **deception environment only**.

- Attacker commands are handled by pure Python logic — never passed to the OS.
- No `os.system()`, `subprocess`, `shell=True`, `eval`, or `exec` with attacker input.
- The fake filesystem is a Python dict.
- The fake database is an in-memory Python object.
- No real credentials, API keys, or environment variables are exposed.
- The real host filesystem is never read or written by attacker commands.

---

## .gitignore Coverage

```gitignore
database/honeypot.db   # SQLite file
*.db                   # All other db files
logs/*.jsonl           # Raw event logs
keys/server.key        # RSA host key
.venv/                 # Virtual environment
__pycache__/           # Python bytecode
*.py[cod]
```