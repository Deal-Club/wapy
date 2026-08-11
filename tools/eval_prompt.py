"""Éval du prompt : comportement ET amorçage du cache, en conditions réelles.

Répond aux deux questions qu'un test unitaire ne peut pas trancher, parce qu'elles
dépendent du modèle et du serveur, pas du code :

1. COMPORTEMENT. Les 7 exemples résolus ajoutés au prompt visent les cas que les
   règles répétaient le plus. Est-ce qu'ils aident, ou est-ce qu'ils déplacent le
   problème ? `--sans-exemples` rejoue exactement les mêmes scénarios sans eux :
   c'est la comparaison A/B qui décide.

2. CACHE. Haiku 4.5 n'amorce son cache qu'à 4 096 tokens de préfixe, et l'échec est
   SILENCIEUX (aucune erreur, juste 0 token mis en cache). Le test unitaire ne sait
   qu'estimer. Ici on lit `cache_creation_input_tokens` et `cache_read_input_tokens`
   renvoyés par l'API : c'est la seule preuve qui vaut.

Usage :
    python -m tools.eval_prompt                          # Haiku, avec exemples
    python -m tools.eval_prompt --sans-exemples          # la même chose sans
    python -m tools.eval_prompt --modele claude-sonnet-5

Prérequis : ANTHROPIC_API_KEY dans wapy/.env. Aucune dépendance à Google Sheets :
les fiches sont des fixtures, pour que deux exécutions soient comparables.
"""
import argparse
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def _load_dotenv(path=".env"):
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip()
        if key and val and key not in os.environ:
            os.environ[key] = val


_load_dotenv()

if not os.environ.get("ANTHROPIC_API_KEY"):
    print("ANTHROPIC_API_KEY absente. Ajoute-la dans wapy/.env :")
    print("   ANTHROPIC_API_KEY=sk-ant-...")
    sys.exit(1)

import anthropic  # noqa: E402
from brain import brain as cerveau  # noqa: E402

# Fiche d'un petit tenant : c'est le profil Starter, celui qui était sous le seuil
# de cache. La garder petite est le point du test, ne pas l'étoffer.
FICHE_SALON = """## Infos
Salon Awa, Cotonou, quartier Fidjrossè. Ouvert 9h à 19h, du lundi au samedi.
Paiement : MTN MoMo au 97 00 00 00, ou espèces.
## Prestations
Tresses : 15 000 FCFA. Défrisage : 12 000 FCFA. Coupe : 5 000 FCFA.
Soin profond : 8 000 FCFA. Pose de perruque : 20 000 FCFA.
## FAQ
Faut-il réserver ? C'est conseillé, surtout le samedi.
Vendez-vous des produits ? Oui, une gamme naturelle.
Acceptez-vous la carte bancaire ? Non, MoMo ou espèces uniquement.
## Consignes
Pour toute demande de devis mariage, transmets la demande au responsable.
"""

CRENEAUX = """

## Rendez-vous
Créneaux disponibles :
[2026-08-13T10:00] Tresses
[2026-08-13T14:00] Tresses
[2026-08-14T09:00] Défrisage
"""

# Chaque scénario cible un des exemples ajoutés au prompt. `attendu` sert à repérer
# une dérive d'un coup d'oeil ; il ne fait pas foi tout seul, lis la réponse.
SCENARIOS = [
    {
        "nom": "consigne « transmets » = démarche, PAS escalade",
        "message": "Bonjour, je voudrais un devis pour mon mariage en décembre.",
        "attendu": ("reply", "record"),
        "piege": "escalate : la consigne dit transmettre, ce n'est pas passer la main",
    },
    {
        "nom": "information absente, aucune consigne",
        "message": "Vous faites aussi les extensions à chaud ?",
        "attendu": ("reply",),
        "piege": "escalate, ou pire : inventer un prix",
    },
    {
        "nom": "grossièreté sans grief",
        "message": "Franchement c'est nul votre truc.",
        "attendu": ("reply",),
        "piege": "escalate sur un simple agacement",
    },
    {
        "nom": "réclamation réelle",
        "message": "Ça fait deux jours que j'attends une réponse, c'est inadmissible.",
        "attendu": ("escalate",),
        "piege": "reply : là il FAUT passer la main",
    },
    {
        "nom": "justificatif de paiement",
        "message": "[Le client a envoyé une pièce jointe : capture de paiement.]",
        "attendu": ("record",),
        "piege": "déclarer le paiement validé alors que personne ne l'a vérifié",
    },
    {
        "nom": "prix listé, réponse directe",
        "message": "C'est combien les tresses ?",
        "attendu": ("reply",),
        "piege": "escalader une info qui est dans la fiche",
    },
    {
        "nom": "choix d'un créneau : horodatage exact",
        "message": "Parfait, je prends jeudi 10h pour des tresses.",
        "attendu": ("book",),
        "extra": CRENEAUX,
        "historique": [
            {"role": "user", "content": "Bonjour, je voudrais un rendez-vous."},
            {"role": "assistant", "content": "Avec plaisir ! Pour quelle prestation ?"},
        ],
        "piege": "reformuler l'horodatage au lieu de recopier 2026-08-13T10:00",
    },
]


def _sans_exemples():
    """Neutralise le bloc d'exemples pour la branche A/B, sans toucher au fichier."""
    cerveau.EXEMPLES = ""


def _usage(reponse):
    u = reponse.usage
    return (
        getattr(u, "input_tokens", 0),
        getattr(u, "cache_creation_input_tokens", 0) or 0,
        getattr(u, "cache_read_input_tokens", 0) or 0,
    )


def main():
    parseur = argparse.ArgumentParser()
    parseur.add_argument("--modele", default="claude-haiku-4-5-20251001")
    parseur.add_argument("--sans-exemples", action="store_true")
    args = parseur.parse_args()

    if args.sans_exemples:
        _sans_exemples()

    client = anthropic.Anthropic()
    etat = "SANS exemples" if args.sans_exemples else "AVEC exemples"
    print(f"Modèle : {args.modele}   ({etat})")
    print("=" * 72)

    ecrit = lu = 0
    ecarts = []

    for scenario in SCENARIOS:
        extra = scenario.get("extra", "")
        historique = scenario.get("historique", [])
        reponse = client.messages.create(
            model=args.modele,
            max_tokens=1024,
            system=cerveau.build_system_blocks(FICHE_SALON, "whatsapp", extra),
            messages=cerveau.build_messages(historique, scenario["message"], extra),
            output_config={"format": {"type": "json_schema", "schema": cerveau.DECISION_SCHEMA}},
        )
        import json
        texte = next(b.text for b in reponse.content if b.type == "text")
        d = json.loads(texte)
        entree, creation, lecture = _usage(reponse)
        ecrit += creation
        lu += lecture

        conforme = d["action"] in scenario["attendu"]
        if not conforme:
            ecarts.append(scenario["nom"])
        marque = "ok " if conforme else "ECART"
        print(f"\n[{marque}] {scenario['nom']}")
        print(f"  client   : {scenario['message']}")
        print(f"  action   : {d['action']}   (attendu : {'/'.join(scenario['attendu'])})")
        print(f"  reponse  : {d['message'][:160]}")
        if d.get("book_datetime"):
            exact = d["book_datetime"] == "2026-08-13T10:00"
            print(f"  creneau  : {d['book_datetime']}  {'exact' if exact else 'NON EXACT'}")
        if d.get("record"):
            print(f"  record   : {d['record_type']} / {d['record'][:120]}")
        if not conforme:
            print(f"  piege    : {scenario['piege']}")

    print("\n" + "=" * 72)
    print(f"Ecarts : {len(ecarts)}/{len(SCENARIOS)}" + (f" -> {', '.join(ecarts)}" if ecarts else ""))
    print(f"Cache  : {ecrit} tokens ecrits, {lu} tokens relus")
    if ecrit == 0 and lu == 0:
        print(
            "  ATTENTION : rien n'a ete mis en cache. Sur Haiku c'est le seuil des\n"
            "  4 096 tokens de prefixe qui n'est pas atteint, et l'API ne le signale\n"
            "  pas. C'est exactement la panne silencieuse que les exemples corrigent."
        )
    elif lu == 0:
        print("  Premiere execution : le cache vient d'etre ecrit. Relance pour voir les lectures.")


if __name__ == "__main__":
    main()
