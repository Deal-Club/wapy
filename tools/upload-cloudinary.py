"""Envoie les visuels du site sur Cloudinary et affiche les URLs publiques.

    python tools/upload-cloudinary.py [fichier...]

Sans argument, envoie les quatre scenes de la page d'accueil. Les identifiants
sont lus dans CLOUDINARY_URL (.env), jamais ecrits en dur ici :
    cloudinary://<api_key>:<api_secret>@<cloud_name>

La signature attendue par Cloudinary est le SHA-1 des parametres tries, joints
par « & », suivis du secret. Le secret n'est jamais transmis dans la requete et
n'est jamais affiche.
"""
import hashlib
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests

RACINE = Path(__file__).resolve().parent.parent
SCENES = RACINE / "web/public/images/scenes"
DOSSIER_DISTANT = "wapy/scenes"


def _charger_env(chemin=RACINE / ".env"):
    """Lit le .env sans dependance supplementaire."""
    if not chemin.exists():
        return
    for ligne in chemin.read_text(encoding="utf-8").splitlines():
        ligne = ligne.strip()
        if not ligne or ligne.startswith("#") or "=" not in ligne:
            continue
        cle, _, valeur = ligne.partition("=")
        os.environ.setdefault(cle.strip(), valeur.strip())


def _identifiants():
    _charger_env()
    url = os.environ.get("CLOUDINARY_URL", "").strip()
    if not url:
        sys.exit("CLOUDINARY_URL absente du .env")
    p = urlparse(url)
    if not (p.username and p.password and p.hostname):
        sys.exit("CLOUDINARY_URL malformee : cloudinary://<key>:<secret>@<cloud>")
    return p.username, p.password, p.hostname


def envoyer(fichier: Path, api_key: str, api_secret: str, cloud: str) -> str:
    # `public_id` sans extension : Cloudinary la deduit du fichier envoye.
    public_id = f"{DOSSIER_DISTANT}/{fichier.stem}"
    horodatage = int(time.time())
    # Parametres signes, tries par nom. `overwrite` permet de relancer le script
    # apres avoir regenere une image sans creer de doublon.
    a_signer = f"overwrite=true&public_id={public_id}&timestamp={horodatage}"
    signature = hashlib.sha1((a_signer + api_secret).encode()).hexdigest()

    with fichier.open("rb") as f:
        reponse = requests.post(
            f"https://api.cloudinary.com/v1_1/{cloud}/image/upload",
            data={
                "api_key": api_key,
                "timestamp": horodatage,
                "public_id": public_id,
                "overwrite": "true",
                "signature": signature,
            },
            files={"file": f},
            timeout=120,
        )
    if reponse.status_code != 200:
        sys.exit(f"{fichier.name} : echec {reponse.status_code} — {reponse.text[:300]}")
    return reponse.json()["secure_url"]


def main():
    api_key, api_secret, cloud = _identifiants()
    fichiers = [Path(a) for a in sys.argv[1:]] or sorted(SCENES.glob("*.webp"))
    if not fichiers:
        sys.exit(f"aucun fichier a envoyer dans {SCENES}")

    print(f"compte Cloudinary : {cloud}\n")
    for fichier in fichiers:
        url = envoyer(fichier, api_key, api_secret, cloud)
        poids = fichier.stat().st_size // 1024
        print(f"{fichier.name:<26} {poids:>4} Ko  ->  {url}")


if __name__ == "__main__":
    main()
