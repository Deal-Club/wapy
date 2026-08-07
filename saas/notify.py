"""Envoi d'e-mails (relance d'abonnement...).

Actif si SMTP est configuré (SMTP_HOST/PORT/USER/PASS/FROM). Sinon no-op silencieux.
"""
import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger("wapy.notify")


def email_enabled() -> bool:
    return bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_FROM"))


def send_email(to: str, subject: str, body: str) -> bool:
    if not to or not email_enabled():
        return False
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    pwd = os.environ.get("SMTP_PASS", "")
    sender = os.environ.get("SMTP_FROM", user)
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(host, port, timeout=20) as s:
            s.starttls()
            if user:
                s.login(user, pwd)
            s.send_message(msg)
        return True
    except Exception as e:
        logger.error("E-mail non envoyé à %s : %s", to, e)
        return False
