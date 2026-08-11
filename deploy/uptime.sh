#!/usr/bin/env bash
# Surveillance Wapy -> alerte Telegram UNIQUEMENT au changement d'état (down/up).
# Vérifie l'API (pas juste le web statique). Lancé par cron toutes les ~3 min.
# Secrets (TG_TOKEN / TG_CHAT) dans deploy/.uptime_env (hors dépôt Git).
set -uo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

DIR="/home/ubuntu/wapy-platform/deploy"
STATE_FILE="/home/ubuntu/wapy-backups/uptime.state"
URL="https://wapy.pro/api/widget/config?k=ping"  # exerce l'API
[ -f "$DIR/.uptime_env" ] && . "$DIR/.uptime_env"
: "${TG_TOKEN:=}" "${TG_CHAT:=}"

send() {
  [ -z "$TG_TOKEN" ] && return 0
  curl -s --max-time 15 "https://api.telegram.org/bot$TG_TOKEN/sendMessage" \
    -d chat_id="$TG_CHAT" --data-urlencode text="$1" >/dev/null 2>&1 || true
}

code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL" 2>/dev/null || echo 000)"
now="down"; [ "$code" = "200" ] && now="up"
prev="$(cat "$STATE_FILE" 2>/dev/null || echo up)"

if [ "$now" != "$prev" ]; then
  if [ "$now" = "up" ]; then
    send "✅ Wapy est de nouveau EN LIGNE (HTTP $code)."
  else
    send "🚨 Wapy est HORS LIGNE (HTTP $code). À vérifier sur le serveur."
  fi
  echo "$now" > "$STATE_FILE"
fi
