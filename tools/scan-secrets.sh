#!/usr/bin/env bash
# Barrage anti-secret. Refuse les fichiers qui n'ont rien a faire dans le depot
# (.env reel, credentials.json, base SQLite, sessions WAHA) et les clefs en dur.
#
# Pourquoi : le .gitignore protege des fichiers connus a un instant t. Il ne dit
# rien d'une clef collee dans un fichier source, ni d'un secret ajoute avec -f.
# Sur un depot distant, retirer un secret de l'historique coute un rewrite et une
# rotation de la clef : le seul moment ou c'est bon marche, c'est avant le commit.
#
#   tools/scan-secrets.sh                 # tout ce qui est suivi par Git
#   tools/scan-secrets.sh a.py b.ts       # seulement ces fichiers
#
# Sortie 0 = rien trouve. Sortie 1 = au moins une alerte (detail sur stderr).
#
# Le scan ne reimprime jamais la ligne fautive, seulement son emplacement : un
# outil de securite qui recopie le secret dans les logs de CI le fait fuiter.
set -uo pipefail

# --- Regles sur les noms de fichiers -----------------------------------------
# Un nom qui matche ici ne doit jamais entrer dans le depot, quel que soit son
# contenu. Les gabarits (*.example) sont explicitement autorises.
nom_interdit() {
  case "$1" in
    *.example|*.example.*) return 1 ;;
    .env|*/.env|.env.*|*/.env.*)          echo "fichier d'environnement reel" ;;
    credentials.json|*/credentials.json)  echo "compte de service Google" ;;
    *.pem|*.p12|*.pfx)                    echo "certificat / clef privee" ;;
    *.key)                                echo "clef privee" ;;
    *.db|*.sqlite|*.sqlite3)              echo "base de donnees" ;;
    .uptime_env|*/.uptime_env)            echo "secrets du moniteur" ;;
    waha_sessions/*|*/waha_sessions/*)    echo "session WhatsApp" ;;
    qr.png|qr_live.html)                  echo "artefact de session WhatsApp" ;;
    *) return 1 ;;
  esac
  return 0
}

# --- Regles sur le contenu ----------------------------------------------------
# Format "libelle::regex" (ERE). Volontairement a haute precision : ces motifs
# designent des formats de clefs reels, pas "une chaine qui a l'air aleatoire".
# Une regle du type "32 caracteres hexa" flaguerait la clef IndexNow de
# web/scripts/indexnow.mjs, qui est publique par conception.
MOTIFS=(
  "clef Anthropic::sk-ant-[A-Za-z0-9_-]{16,}"
  # Sans tiret apres le prefixe : sinon ce motif reattrape toutes les clefs
  # Anthropic (sk-ant-...) et chaque fuite est signalee deux fois.
  "clef OpenAI::sk-(proj-)?[A-Za-z0-9]{20,}"
  "clef Google API::AIza[0-9A-Za-z_-]{35}"
  "token GitHub::(gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})"
  "token Slack::xox[abprs]-[A-Za-z0-9-]{10,}"
  "clef AWS::AKIA[0-9A-Z]{16}"
  "token Telegram::[0-9]{8,10}:AA[A-Za-z0-9_-]{33}"
  "clef privee PEM::-----BEGIN [A-Z ]*PRIVATE KEY-----"
  "clef de compte de service::\"private_key\"[[:space:]]*:"
)

# Regle generique : une variable a nom sensible affectee a une valeur litterale
# entre guillemets. Ce sont les guillemets et l'absence de parenthese qui
# separent une affectation en dur (alerte) d'une lecture d'environnement du type
# os.environ.get(...), qui est saine.
# L'exemple fautif n'est volontairement pas ecrit ici : il declencherait la
# regle sur ce fichier meme.
MOTIF_GENERIQUE='(PASSWORD|PASSWD|SECRET|API_KEY|APIKEY|ACCESS_KEY|AUTH_TOKEN|_TOKEN)[A-Z_]*[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"'$(){}[:space:]]{8,}["'"'"']'

alertes=0
signaler() {
  alertes=$((alertes + 1))
  printf '  %s\n' "$1" >&2
}

# Un grep par regle sur toute la liste de fichiers, et non l'inverse : a
# l'envers, c'est un processus par (fichier x regle), soit des milliers de
# lancements et plusieurs minutes sur un depot de cette taille.
grep_regle() {
  local regex="$1" libelle="$2"; shift 2
  [ "$#" -eq 0 ] && return 0
  local loc
  while IFS= read -r loc; do
    [ -n "$loc" ] && signaler "$loc — $libelle"
  # -e est obligatoire : le motif PEM commence par des tirets, que grep prendrait
  # sinon pour des options et rejetterait (la regle ne matcherait jamais rien).
  done < <(printf '%s\0' "$@" | xargs -0 grep -IHnE -e "$regex" 2>/dev/null | cut -d: -f1,2)
}

demandes=("$@")
if [ "$#" -eq 0 ]; then
  # Boucle de lecture plutot que `mapfile` : absent du bash 3.2 de macOS.
  demandes=()
  while IFS= read -r fichier; do
    demandes+=("$fichier")
  done < <(git ls-files)
fi

# Noms interdits (pur bash) + tri des fichiers reellement lisibles.
a_scanner=()
sans_gabarits=()
for f in "${demandes[@]}"; do
  [ -f "$f" ] || continue
  if motif="$(nom_interdit "$f")"; then
    signaler "$f — $motif : ce fichier ne doit pas etre versionne"
    continue
  fi
  a_scanner+=("$f")
  case "$f" in
    *.example|*.example.*) ;;
    *) sans_gabarits+=("$f") ;;
  esac
done

if [ "${#a_scanner[@]}" -gt 0 ]; then
  for regle in "${MOTIFS[@]}"; do
    grep_regle "${regle#*::}" "${regle%%::*}" "${a_scanner[@]}"
  done
fi
if [ "${#sans_gabarits[@]}" -gt 0 ]; then
  grep_regle "$MOTIF_GENERIQUE" "variable sensible affectee en dur" "${sans_gabarits[@]}"
fi

if [ "$alertes" -gt 0 ]; then
  printf '\nBarrage anti-secret : %d alerte(s).\n' "$alertes" >&2
  printf 'Si c est un faux positif, ajuste tools/scan-secrets.sh plutot que de contourner.\n' >&2
  exit 1
fi
exit 0
