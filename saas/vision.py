"""Vision : lire le contenu d'une image reçue par le bot.

Cas principal : les justificatifs de paiement (Mobile Money, virement, reçu). On
EXTRAIT les infos (montant, référence, expéditeur, moyen) pour que le bot confirme
la bonne réception et enregistre un paiement précis. On ne VALIDE jamais le paiement
(seul un humain le fait) : la vision ne fait que lire.
"""
import base64

_ALLOWED = ("image/jpeg", "image/png", "image/gif", "image/webp")

SYSTEM = (
    "Tu analyses une image envoyée par un client sur WhatsApp à un commerce. "
    "Le plus souvent, c'est une capture de paiement (MTN MoMo, Moov, Celtiis Cash, "
    "virement, reçu). Extrait les infos utiles en une ou deux phrases en français : "
    "montant et devise, référence / identifiant de transaction, expéditeur ou numéro, "
    "date, et moyen de paiement. Si ce n'est pas un paiement, décris brièvement l'image. "
    "Si c'est illisible, dis-le clairement. Ne déclare JAMAIS que le paiement est validé : "
    "tu ne fais que lire ce qui est visible."
)


def analyze_image(client, model: str, image_bytes: bytes, media_type: str = "image/jpeg") -> str:
    mt = media_type if media_type in _ALLOWED else "image/jpeg"
    b64 = base64.standard_b64encode(image_bytes).decode()
    resp = client.messages.create(
        model=model,
        max_tokens=400,
        system=SYSTEM,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": mt, "data": b64}},
                {"type": "text", "text": "Que montre cette image ? Extrait les infos de paiement si présentes."},
            ],
        }],
    )
    return next((b.text for b in resp.content if b.type == "text"), "").strip()
