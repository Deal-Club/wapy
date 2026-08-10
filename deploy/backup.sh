#!/usr/bin/env bash
# Sauvegarde quotidienne Wapy : base Postgres + sessions WhatsApp (WAHA).
# Conserve les KEEP_DAYS derniers jours. Prévu pour être lancé par cron.
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

DEPLOY_DIR="/home/ubuntu/wapy-platform/deploy"
BACKUP_DIR="/home/ubuntu/wapy-backups"
KEEP_DAYS=7
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
cd "$DEPLOY_DIR"

# 1) Base de données (dump SQL compressé)
docker compose exec -T postgres pg_dump -U wapy wapy | gzip > "$BACKUP_DIR/db_$STAMP.sql.gz"

# 2) Sessions WhatsApp (WAHA) — évite de re-scanner tous les QR après un incident
if [ -d "$DEPLOY_DIR/waha_sessions" ]; then
  tar czf "$BACKUP_DIR/waha_$STAMP.tgz" -C "$DEPLOY_DIR" waha_sessions
fi

# 3) Purge des sauvegardes plus vieilles que KEEP_DAYS jours
find "$BACKUP_DIR" -name 'db_*.sql.gz' -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'waha_*.tgz'  -mtime "+$KEEP_DAYS" -delete

echo "$(date -Is) backup OK -> db_$STAMP.sql.gz (+ waha)"
