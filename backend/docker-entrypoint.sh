#!/bin/sh
set -e

if [ -n "${POSTGRES_HOST:-}" ]; then
  echo "Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT:-5432}..."
  python - <<'PY'
import os, socket, time
host = os.getenv("POSTGRES_HOST", "postgres")
port = int(os.getenv("POSTGRES_PORT", "5432"))
deadline = time.time() + 60
while True:
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        if time.time() > deadline:
            raise SystemExit("Postgres not reachable after 60s")
        time.sleep(1)
print("Postgres is reachable")
PY
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers ${GUNICORN_WORKERS:-3} \
  --timeout ${GUNICORN_TIMEOUT:-120}
