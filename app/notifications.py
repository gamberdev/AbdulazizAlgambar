import os
from typing import Optional
from twilio.rest import Client
from flask import current_app
from .models import NotificationLog
from . import DbSession as db


def _is_enabled() -> bool:
    enable_str = os.getenv("ENABLE_WHATSAPP", "false").strip().lower()
    return enable_str in {"1", "true", "yes", "on"}


def send_whatsapp_message(to_phone_e164: str, body: str, appointment_id: Optional[int] = None) -> None:
    if not _is_enabled():
        log = NotificationLog(
            appointment_id=appointment_id,
            channel="whatsapp",
            status="disabled",
            details=f"Would send to {to_phone_e164}: {body[:200]}...",
        )
        db.session.add(log)
        db.session.commit()
        return

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    whatsapp_from = os.getenv("TWILIO_WHATSAPP_FROM")

    if not account_sid or not auth_token or not whatsapp_from:
        log = NotificationLog(
            appointment_id=appointment_id,
            channel="whatsapp",
            status="misconfigured",
            details="Missing TWILIO_* env vars",
        )
        db.session.add(log)
        db.session.commit()
        return

    try:
        client = Client(account_sid, auth_token)
        msg = client.messages.create(
            from_=whatsapp_from,
            to=f"whatsapp:{to_phone_e164}",
            body=body,
        )
        log = NotificationLog(
            appointment_id=appointment_id,
            channel="whatsapp",
            status="sent",
            details=f"sid={msg.sid}",
        )
        db.session.add(log)
        db.session.commit()
    except Exception as exc:  # noqa: BLE001
        log = NotificationLog(
            appointment_id=appointment_id,
            channel="whatsapp",
            status="error",
            details=str(exc),
        )
        db.session.add(log)
        db.session.commit()