"""Envoi d'e-mails (relance d'abonnement...), avec un rendu HTML soigné.

Actif si SMTP est configuré (SMTP_HOST/PORT/USER/PASS/FROM). Sinon no-op silencieux.
Supporte SSL direct (port 465, SMTP_SECURE=true) et STARTTLS (port 587).
"""
import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

logger = logging.getLogger("wapy.notify")

BRAND = "#C2502F"
CREAM = "#F7F4EF"
INK = "#2b2b2b"


def email_enabled() -> bool:
    return bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_FROM"))


def render_email(title: str, intro: str, lines: list[str], cta_label: str = "", cta_url: str = "") -> str:
    """Gabarit HTML sobre et professionnel (compatible clients mail)."""
    body = "".join(f'<p style="margin:0 0 12px;line-height:1.6;color:{INK}">{l}</p>' for l in lines)
    cta = ""
    if cta_label and cta_url:
        cta = (
            f'<tr><td style="padding:8px 0 4px"><a href="{cta_url}" '
            f'style="display:inline-block;background:{BRAND};color:#fff;text-decoration:none;'
            f'padding:12px 22px;border-radius:10px;font-weight:600">{cta_label}</a></td></tr>'
        )
    return f"""\
<!doctype html><html><body style="margin:0;background:{CREAM};padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ece7df">
      <tr><td style="background:{BRAND};padding:18px 24px">
        <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.3px">Wapy</span>
      </td></tr>
      <tr><td style="padding:24px">
        <h1 style="margin:0 0 12px;font-size:19px;color:{INK}">{title}</h1>
        <p style="margin:0 0 16px;line-height:1.6;color:{INK}">{intro}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">{body}{cta}</table>
      </td></tr>
      <tr><td style="padding:14px 24px;border-top:1px solid #f0ece5;color:#9b948c;font-size:12px">
        Wapy · votre assistant WhatsApp. Cet e-mail vous est envoyé au sujet de votre compte.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>"""


def send_email(to: str, subject: str, text: str, html: str | None = None) -> bool:
    if not to or not email_enabled():
        return False
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "587") or "587")
    user = os.environ.get("SMTP_USER", "")
    pwd = os.environ.get("SMTP_PASS", "")
    sender = os.environ.get("SMTP_FROM", user)
    secure = (os.environ.get("SMTP_SECURE", "").lower() in ("1", "true", "yes")) or port == 465

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")
    try:
        ctx = ssl.create_default_context()
        if secure:
            with smtplib.SMTP_SSL(host, port, timeout=25, context=ctx) as s:
                if user:
                    s.login(user, pwd)
                s.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=25) as s:
                s.starttls(context=ctx)
                if user:
                    s.login(user, pwd)
                s.send_message(msg)
        return True
    except Exception as e:
        logger.error("E-mail non envoyé à %s : %s", to, e)
        return False
