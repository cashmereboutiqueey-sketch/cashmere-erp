"""
Cashmere ERP — Automated KVM2 Deployment
Server: 187.124.182.93  Domain: cashmerebotique.tech
"""
import paramiko
import os
import sys
import time
import tarfile
import io

HOST = "187.124.182.93"
PORT = 22
USER = "root"
PASSWORD = "Cashmere-2026"
REMOTE_DIR = "/opt/cashmere"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

SKIP_DIRS = {
    "__pycache__", ".git", "node_modules", ".next",
    "venv", ".venv", "staticfiles", "media",
    "test-results", "postgres_data", ".mypy_cache",
}
SKIP_EXTS = {".pyc", ".pyo"}
SKIP_FILES = {"deploy.py", "db.sqlite3"}


import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
def bold(msg): print(f"\n{'='*60}\n  {msg}\n{'='*60}")
def ok(msg):   print(f"  [OK]  {msg}")
def info(msg): print(f"  -->  {msg}")
def err(msg):  print(f"  [ERR] {msg}")


def connect():
    bold("Connecting to server")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, PORT, USER, PASSWORD, timeout=30)
    ok(f"Connected to {HOST}")
    return client


def run(client, cmd, desc="", timeout=300, stream=False):
    if desc:
        info(desc)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    output_lines = []
    for line in stdout:
        line = line.rstrip()
        output_lines.append(line)
        if stream:
            print(f"     {line}")
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        out_text = "\n".join(output_lines[-20:])
        err_text = stderr.read().decode()
        err(f"Command failed (exit {exit_code}): {cmd[:80]}")
        if out_text:  print(f"     stdout: {out_text}")
        if err_text:  print(f"     stderr: {err_text}")
        return False, "\n".join(output_lines)
    return True, "\n".join(output_lines)


def bootstrap(client):
    bold("Step 1 — Bootstrap server")

    # Check if Docker already installed
    ok_flag, out = run(client, "docker --version 2>/dev/null && echo DOCKER_OK || echo DOCKER_MISSING")
    if "DOCKER_OK" in out:
        ok("Docker already installed")
    else:
        info("Installing Docker...")
        run(client, "apt-get update -qq", "Updating apt", stream=True, timeout=120)
        run(client, "apt-get install -y -qq apt-transport-https ca-certificates curl gnupg lsb-release",
            "Installing prerequisites", stream=True, timeout=120)
        run(client, "curl -fsSL https://get.docker.com | sh",
            "Installing Docker", stream=True, timeout=300)
        run(client, "systemctl enable --now docker", "Enabling Docker service")
        ok("Docker installed")

    # Docker Compose
    ok_flag, out = run(client, "docker compose version 2>/dev/null && echo COMPOSE_OK || echo COMPOSE_MISSING")
    if "COMPOSE_OK" in out:
        ok("Docker Compose already installed")
    else:
        run(client, "apt-get install -y -qq docker-compose-plugin", "Installing Docker Compose", timeout=120)
        ok("Docker Compose installed")

    # Other tools
    run(client, "apt-get install -y -qq git curl ufw certbot", "Installing git, curl, ufw, certbot", timeout=120)

    # Firewall
    run(client, "ufw allow ssh && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable", "Configuring firewall")
    ok("Firewall configured (22, 80, 443)")


def upload_code(client):
    bold("Step 2 — Upload project code")

    sftp = client.open_sftp()

    # Create remote dir
    run(client, f"mkdir -p {REMOTE_DIR}/nginx/certs")
    ok(f"Remote directory ready: {REMOTE_DIR}")

    # Build tar in memory, upload as single file
    info("Packing project files...")
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for root, dirs, files in os.walk(LOCAL_DIR):
            # Prune skip dirs in-place
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
            for fname in files:
                if fname in SKIP_FILES:
                    continue
                ext = os.path.splitext(fname)[1]
                if ext in SKIP_EXTS:
                    continue
                full = os.path.join(root, fname)
                rel  = os.path.relpath(full, LOCAL_DIR)
                arcname = rel.replace("\\", "/")
                tar.add(full, arcname=arcname)

    size_mb = buf.tell() / 1024 / 1024
    info(f"Archive size: {size_mb:.1f} MB — uploading...")
    buf.seek(0)

    remote_tar = f"{REMOTE_DIR}/_upload.tar.gz"
    sftp.putfo(buf, remote_tar)
    sftp.close()

    run(client, f"cd {REMOTE_DIR} && tar -xzf _upload.tar.gz && rm _upload.tar.gz",
        "Extracting on server")
    ok("Code uploaded and extracted")


def get_ssl(client):
    bold("Step 3 — SSL Certificate (Let's Encrypt)")

    # Check if cert already exists
    ok_flag, out = run(client, "test -f /etc/letsencrypt/live/cashmerebotique.tech/fullchain.pem && echo EXISTS || echo MISSING")
    if "EXISTS" in out:
        ok("Certificate already exists — copying to nginx/certs")
    else:
        info("Requesting certificate from Let's Encrypt...")
        # Stop any process on port 80 first
        run(client, "fuser -k 80/tcp 2>/dev/null; true")
        ok_flag, out = run(client,
            "certbot certonly --standalone "
            "-d cashmerebotique.tech "
            "-d www.cashmerebotique.tech "
            "--agree-tos "
            "--email cashmereboutique.ey@gmail.com "
            "--non-interactive",
            "Running certbot", stream=True, timeout=120)
        if not ok_flag:
            err("certbot failed — likely DNS not propagated yet.")
            err("Will use self-signed cert for now; re-run certbot later.")
            run(client,
                f"openssl req -x509 -nodes -days 365 -newkey rsa:2048 "
                f"-keyout {REMOTE_DIR}/nginx/certs/privkey.pem "
                f"-out {REMOTE_DIR}/nginx/certs/fullchain.pem "
                "-subj '/CN=cashmerebotique.tech'",
                "Generating self-signed cert as fallback")
            ok("Self-signed cert created (replace with Let's Encrypt once DNS propagates)")
            return

    run(client,
        f"cp /etc/letsencrypt/live/cashmerebotique.tech/fullchain.pem {REMOTE_DIR}/nginx/certs/ && "
        f"cp /etc/letsencrypt/live/cashmerebotique.tech/privkey.pem {REMOTE_DIR}/nginx/certs/ && "
        f"chmod 600 {REMOTE_DIR}/nginx/certs/*.pem",
        "Copying certs")

    # Auto-renew cron
    cron = (
        "0 3 * * * certbot renew --quiet && "
        f"cp /etc/letsencrypt/live/cashmerebotique.tech/fullchain.pem {REMOTE_DIR}/nginx/certs/ && "
        f"cp /etc/letsencrypt/live/cashmerebotique.tech/privkey.pem {REMOTE_DIR}/nginx/certs/ && "
        f"chmod 600 {REMOTE_DIR}/nginx/certs/*.pem && "
        f"docker compose -f {REMOTE_DIR}/docker-compose.prod.yml --env-file {REMOTE_DIR}/.env.production restart nginx"
    )
    run(client, f'(crontab -l 2>/dev/null | grep -v certbot; echo "{cron}") | crontab -', "Setting up cert auto-renew")
    ok("SSL certificate ready + auto-renew configured")


def deploy(client):
    bold("Step 4 — Build & Launch containers")

    cmd = (
        f"cd {REMOTE_DIR} && "
        f"docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build 2>&1"
    )
    ok_flag, out = run(client, cmd, "Building images & starting containers (this takes ~5 min)...",
                       stream=True, timeout=600)
    if not ok_flag:
        err("Docker Compose failed. Check logs above.")
        sys.exit(1)
    ok("All containers started")


def wait_healthy(client):
    bold("Step 5 — Waiting for services to be healthy")
    for attempt in range(1, 13):
        _, out = run(client,
            f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production ps --format json 2>/dev/null | head -100")
        info(f"Attempt {attempt}/12 — checking health...")
        _, status = run(client,
            f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production ps")
        print(status)
        # Check if backend is up
        _, check = run(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/ 2>/dev/null")
        if "200" in check or "301" in check or "403" in check:
            ok("Backend is responding")
            break
        if attempt < 12:
            info("Not ready yet, waiting 15s...")
            time.sleep(15)
    else:
        err("Backend did not come up in time — check logs:")
        run(client, f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=50 backend",
            stream=True)


def create_superuser(client):
    bold("Step 6 — Create Django superuser")
    ok_flag, out = run(client,
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production "
        f"exec -T backend python manage.py shell -c \""
        f"from django.contrib.auth.models import User; "
        f"User.objects.filter(username='admin').exists() and print('EXISTS') or print('MISSING')"
        f"\"")
    if "EXISTS" in out:
        ok("Admin user already exists")
        return
    ok_flag, out = run(client,
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production "
        f"exec -T backend python manage.py shell -c \""
        f"from django.contrib.auth.models import User; "
        f"u=User.objects.create_superuser('admin','cashmereboutique.ey@gmail.com','Cashmere@Admin2026!'); "
        f"print('CREATED')"
        f"\"")
    if "CREATED" in out:
        ok("Superuser created:")
        ok("  Username: admin")
        ok("  Password: Cashmere@Admin2026!")
        ok("  Email:    cashmereboutique.ey@gmail.com")
    else:
        err("Superuser creation failed — create manually:")
        info(f"  docker compose -f {REMOTE_DIR}/docker-compose.prod.yml exec backend python manage.py createsuperuser")


def verify(client):
    bold("Step 7 — Final verification")
    checks = [
        ("http://localhost:80",  "Nginx HTTP"),
        ("http://localhost:8000/api/", "Django API"),
        ("http://localhost:3000", "Next.js Frontend"),
    ]
    for url, label in checks:
        _, code = run(client, f"curl -s -o /dev/null -w '%{{http_code}}' {url} --max-time 10 2>/dev/null")
        code = code.strip()
        if code in ("200","301","302","403"):
            ok(f"{label}: HTTP {code}")
        else:
            err(f"{label}: got '{code}'")

    _, out = run(client, f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production ps")
    print(out)


def print_summary():
    bold("DEPLOYMENT COMPLETE")
    print("""
  URL:         https://cashmerebotique.tech
  Admin:       https://cashmerebotique.tech/admin/
  API:         https://cashmerebotique.tech/api/

  Admin login
    Username:  admin
    Password:  Cashmere@Admin2026!

  SSH to server:  ssh root@187.124.182.93
  Logs:           docker compose -f /opt/cashmere/docker-compose.prod.yml logs -f
""")


if __name__ == "__main__":
    client = connect()
    try:
        bootstrap(client)
        upload_code(client)
        get_ssl(client)
        deploy(client)
        wait_healthy(client)
        create_superuser(client)
        verify(client)
        print_summary()
    finally:
        client.close()
