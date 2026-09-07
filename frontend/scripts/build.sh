#!/usr/bin/env bash
# Build and restart the SkynexiaDM frontend on the production Linux server.
#
# Run ON the server as the app user (pracsphereadmin), from any directory:
#   ~/skynexiaDM/frontend/scripts/build.sh
#
# Steps:
#   1. git pull --ff-only origin <branch>      (skip with --no-pull)
#   2. pnpm install --frozen-lockfile
#   3. pnpm build
#   4. sudo systemctl restart <service>        (skip with --no-restart)
#   5. wait until http://127.0.0.1:<port> answers
#
# Environment overrides: BRANCH=main  SERVICE=skynexiadm-frontend  PORT=3152
#
# sudo prompts for your password at the restart step. When there is no
# terminal (cron, plain ssh command), pass --no-restart and then run:
#   sudo systemctl restart skynexiadm-frontend

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$APP_DIR/.." && pwd)"
BRANCH="${BRANCH:-main}"
SERVICE="${SERVICE:-skynexiadm-frontend}"
PORT="${PORT:-3152}"
DO_PULL=1
DO_RESTART=1

usage() {
  echo "Usage: $(basename "$0") [--no-pull] [--no-restart]"
  echo "  --no-pull     build the checkout as-is, do not git pull"
  echo "  --no-restart  build only, do not restart $SERVICE"
}

for arg in "$@"; do
  case "$arg" in
    --no-pull) DO_PULL=0 ;;
    --no-restart) DO_RESTART=0 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; usage >&2; exit 1 ;;
  esac
done

log() { printf '\n==> %s\n' "$*"; }

if [ "$DO_PULL" = 1 ]; then
  log "Pulling latest $BRANCH into $REPO_DIR"
  git -C "$REPO_DIR" fetch origin "$BRANCH"
  git -C "$REPO_DIR" checkout -q "$BRANCH"
  git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"
fi
log "Deploying $(git -C "$REPO_DIR" log -1 --format='%h %s')"

cd "$APP_DIR"
log "Installing dependencies"
pnpm install --frozen-lockfile

log "Building"
pnpm build

if [ "$DO_RESTART" = 0 ]; then
  log "Build complete. Service not restarted; to apply it run: sudo systemctl restart $SERVICE"
  exit 0
fi

log "Restarting $SERVICE"
if sudo -n true 2>/dev/null || [ -t 0 ]; then
  sudo systemctl restart "$SERVICE"
else
  echo "sudo needs a password and there is no terminal. Restart manually:" >&2
  echo "  sudo systemctl restart $SERVICE" >&2
  exit 2
fi

log "Waiting for http://127.0.0.1:$PORT"
for i in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$PORT/" || true)"
  if [ -n "$code" ] && [ "$code" != "000" ]; then
    echo "Up (HTTP $code) after ${i}s"
    systemctl status "$SERVICE" --no-pager -l | head -5
    exit 0
  fi
  sleep 1
done
echo "App did not respond on port $PORT within 30s. Check: journalctl -u $SERVICE -n 50" >&2
exit 3
