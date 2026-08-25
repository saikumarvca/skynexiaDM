#!/usr/bin/env bash
# Creates/updates an ADMIN login user for the frontend (dm.db2.in) dashboard.
# Run this ON the production server, from inside the frontend app directory
# (the one containing scripts/seed-user.mjs and package.json with "seed:user"),
# or as: ./scripts/create-admin.sh from the app root.
#
# Usage:
#   ./scripts/create-admin.sh
#
# Prompts interactively for the email and password — nothing is hardcoded
# or passed on the command line (which would leak into shell history).

set -euo pipefail

read -rp "Admin email: " SEED_EMAIL
if [ -z "$SEED_EMAIL" ]; then
  echo "Email cannot be empty." >&2
  exit 1
fi

read -rsp "Admin password: " SEED_PASSWORD
echo
if [ -z "$SEED_PASSWORD" ]; then
  echo "Password cannot be empty." >&2
  exit 1
fi

read -rsp "Confirm password: " SEED_PASSWORD_CONFIRM
echo
if [ "$SEED_PASSWORD" != "$SEED_PASSWORD_CONFIRM" ]; then
  echo "Passwords do not match." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
cd "$APP_DIR"

if [ ! -f "scripts/seed-user.mjs" ]; then
  echo "scripts/seed-user.mjs not found in ${APP_DIR}." >&2
  exit 1
fi

# Pick up the production MONGODB_URI already configured for this app.
# Prefer .env.local, fall back to .env — same lookup Next.js itself uses.
if [ -f .env.local ]; then
  set -a; source .env.local; set +a
elif [ -f .env ]; then
  set -a; source .env; set +a
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "MONGODB_URI is not set (no .env/.env.local found with it, and none in the environment)." >&2
  echo "Export it manually, e.g.: export MONGODB_URI='mongodb://localhost:27017/skynexia'" >&2
  exit 1
fi

echo "Using MongoDB: ${MONGODB_URI}"
echo "Upserting ADMIN user: ${SEED_EMAIL}"

SEED_EMAIL="$SEED_EMAIL" SEED_PASSWORD="$SEED_PASSWORD" node scripts/seed-user.mjs

echo "Done. Log in to the dashboard with ${SEED_EMAIL} / (the password you set)."
echo "Consider changing the password after first login."
