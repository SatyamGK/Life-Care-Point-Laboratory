import os
import requests
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
META_GRAPH_API_VERSION = os.getenv(
    "META_GRAPH_API_VERSION",
    "v23.0"
)


def normalize_phone(phone):
    return (
        str(phone)
        .replace("+", "")
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )


def send_whatsapp_message(recipient, message):
    if not WHATSAPP_ACCESS_TOKEN:
        raise ValueError(
            "WHATSAPP_ACCESS_TOKEN is missing from .env"
        )

    if not WHATSAPP_PHONE_NUMBER_ID:
        raise ValueError(
            "WHATSAPP_PHONE_NUMBER_ID is missing from .env"
        )

    recipient = normalize_phone(recipient)

    url = (
        f"https://graph.facebook.com/"
        f"{META_GRAPH_API_VERSION}/"
        f"{WHATSAPP_PHONE_NUMBER_ID}/messages"
    )

    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message,
        },
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=20,
    )

    print("WhatsApp Status:", response.status_code)
    print("WhatsApp Response:", response.text)

    if not response.ok:
        raise RuntimeError(
            f"WhatsApp API error: {response.text}"
        )

    return response.json()