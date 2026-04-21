"""Re-upload changed files and rebuild backend."""
import paramiko, io, tarfile, os, sys, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = '187.124.182.93'
REMOTE_DIR = '/opt/cashmere'
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

SKIP_DIRS  = {'__pycache__', '.git', 'node_modules', '.next', 'venv', '.venv',
               'staticfiles', 'media', 'test-results', 'postgres_data', '.mypy_cache'}
SKIP_FILES = {'deploy.py', 'redeploy.py', 'db.sqlite3'}
SKIP_EXTS  = {'.pyc', '.pyo'}

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, 22, 'root', 'Cashmere-2026', timeout=30)
print('[OK] Connected to', HOST)


def run(cmd, desc='', timeout=300):
    if desc:
        print(f'  --> {desc}')
    _, stdout, _ = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode()
    rc  = stdout.channel.recv_exit_status()
    if rc != 0:
        print(f'  [ERR] exit {rc}\n{out[-800:]}')
    return rc == 0, out


# ── Pack & upload ──────────────────────────────────────────────────────────────
print('[OK] Packing project files...')
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w:gz') as tar:
    for root, dirs, files in os.walk(LOCAL_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
        for fname in files:
            if fname in SKIP_FILES:
                continue
            if os.path.splitext(fname)[1] in SKIP_EXTS:
                continue
            full    = os.path.join(root, fname)
            rel     = os.path.relpath(full, LOCAL_DIR)
            arcname = rel.replace('\\', '/')
            tar.add(full, arcname=arcname)

sz = buf.tell() / 1024 / 1024
print(f'  --> {sz:.1f} MB — uploading...')
buf.seek(0)
sftp = client.open_sftp()
sftp.putfo(buf, f'{REMOTE_DIR}/_upload.tar.gz')
sftp.close()

run(f'cd {REMOTE_DIR} && tar -xzf _upload.tar.gz && rm _upload.tar.gz', 'Extracting on server')
print('[OK] Files updated')

# ── Rebuild backend (code change, no dep change = fast) ───────────────────────
print()
ok, out = run(
    f'cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production '
    f'up -d --build --no-deps backend 2>&1',
    'Rebuilding backend container', timeout=300)
print(out[-1500:])

time.sleep(12)

run(f'cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production '
    f'restart frontend nginx', 'Restarting frontend + nginx')

time.sleep(8)

# ── Status ─────────────────────────────────────────────────────────────────────
_, out = run(f'cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production ps 2>&1')
print('\n[OK] Container status:')
print(out)

_, code = run('curl -sk -o /dev/null -w "%{http_code}" http://localhost:8000/api/')
print(f'[OK] /api/ HTTP status: {code.strip()}')

_, code2 = run('curl -sk -o /dev/null -w "%{http_code}" http://localhost:3000/')
print(f'[OK] /     HTTP status: {code2.strip()}')

# ── Create superuser ───────────────────────────────────────────────────────────
print()
print('[OK] Creating superuser...')
script = (
    "from django.contrib.auth.models import User; "
    "User.objects.filter(username='admin').exists() and print('EXISTS') or "
    "(User.objects.create_superuser('admin','cashmereboutique.ey@gmail.com','Cashmere@Admin2026!') or print('CREATED'))"
)
ok, out = run(
    f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml --env-file .env.production "
    f"exec -T backend python manage.py shell -c \"{script}\"",
    'Creating admin user')
if 'EXISTS' in out:
    print('[OK] Admin user already exists')
elif 'CREATED' in out:
    print('[OK] Admin user created:')
    print('       Username: admin')
    print('       Password: Cashmere@Admin2026!')
else:
    print('[ERR] Check output:', out[-300:])

client.close()

print("""
============================================================
  CASHMERE ERP — DEPLOYED
============================================================
  Server IP : 187.124.182.93
  Domain    : cashmerebotique.tech  (update DNS to point here)
  Admin     : https://cashmerebotique.tech/admin/
  API       : https://cashmerebotique.tech/api/

  Admin login
    Username : admin
    Password : Cashmere@Admin2026!

  NOTE: DNS currently points to 2.57.91.91
  Fix in your domain registrar:
    A record  @    -> 187.124.182.93
    A record  www  -> 187.124.182.93
  Then run certbot for a real SSL cert.
============================================================
""")
