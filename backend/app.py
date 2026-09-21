import json
import os
import re
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from whatsapp import send_whatsapp_message

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

ADMIN_WHATSAPP_NUMBER = os.getenv("ADMIN_WHATSAPP_NUMBER", "").strip()

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)

DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

BOOKINGS_FILE = os.path.join(DATA_DIR, "bookings.json")
ENQUIRIES_FILE = os.path.join(DATA_DIR, "enquiries.json")


def ensure_json_file(path):
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as file:
            json.dump([], file, indent=2, ensure_ascii=False)


def read_json(path):
    try:
        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


ensure_json_file(BOOKINGS_FILE)
ensure_json_file(ENQUIRIES_FILE)

INDIAN_MOBILE_PATTERN = re.compile(r"^[6-9]\d{9}$")


def normalize_indian_mobile(value):
    if value is None:
        return ""

    value = str(value).strip()
    value = (
        value.replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    if value.startswith("+91"):
        value = value[3:]
    elif value.startswith("91") and len(value) == 12:
        value = value[2:]

    return value


def is_valid_indian_mobile(value):
    return bool(INDIAN_MOBILE_PATTERN.fullmatch(value))


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def send_admin_whatsapp(message):
    if not ADMIN_WHATSAPP_NUMBER:
        raise RuntimeError("ADMIN_WHATSAPP_NUMBER is missing from .env")

    return send_whatsapp_message(
        ADMIN_WHATSAPP_NUMBER,
        message,
    )


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "Life Care Point Laboratory backend is running.",
    })


@app.get("/api/health")
def health():
    return jsonify({
        "success": True,
        "status": "ok",
        "whatsapp_configured": bool(
            os.getenv("WHATSAPP_ACCESS_TOKEN")
            and os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        ),
        "admin_whatsapp_configured": bool(ADMIN_WHATSAPP_NUMBER),
    })


@app.post("/api/bookings")
def create_booking():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    mobile = normalize_indian_mobile(data.get("mobile", ""))
    booking_type = str(data.get("type", "booking")).strip()
    item_name = str(data.get("itemName", "")).strip()
    price = data.get("price", 0)

    if not name:
        return jsonify({
            "success": False,
            "message": "Full name is required.",
        }), 400

    if not is_valid_indian_mobile(mobile):
        return jsonify({
            "success": False,
            "message": "Please enter a valid 10-digit Indian mobile number.",
        }), 400

    if not item_name:
        return jsonify({
            "success": False,
            "message": "Test or package name is required.",
        }), 400

    booking = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
        "createdAt": now_iso(),
        "name": name,
        "mobile": mobile,
        "type": booking_type,
        "itemName": item_name,
        "price": price,
    }

    bookings = read_json(BOOKINGS_FILE)
    bookings.append(booking)
    write_json(BOOKINGS_FILE, bookings)

    whatsapp_status = "not_sent"
    whatsapp_error = None

    whatsapp_message = (
        "🔔 New Booking - Life Care Point Laboratory\n\n"
        f"Patient Name: {name}\n"
        f"Mobile: {mobile}\n"
        f"Type: {booking_type}\n"
        f"Test/Package: {item_name}\n"
        f"Price: ₹{price}\n\n"
        "Please contact the patient for confirmation."
    )

    try:
        send_admin_whatsapp(whatsapp_message)
        whatsapp_status = "sent"
    except Exception as error:
        whatsapp_status = "failed"
        whatsapp_error = str(error)
        print("WhatsApp notification failed:", error)

    return jsonify({
        "success": True,
        "message": "Booking submitted successfully.",
        "booking": booking,
        "whatsapp": whatsapp_status,
        "whatsappError": whatsapp_error,
    }), 201


@app.post("/api/enquiries")
def create_enquiry():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    mobile = normalize_indian_mobile(data.get("mobile", ""))
    message = str(data.get("message", "")).strip()
    source = str(data.get("source", "website")).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Full name is required.",
        }), 400

    if not is_valid_indian_mobile(mobile):
        return jsonify({
            "success": False,
            "message": "Please enter a valid 10-digit Indian mobile number.",
        }), 400

    enquiry = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S%f"),
        "createdAt": now_iso(),
        "name": name,
        "mobile": mobile,
        "message": message,
        "source": source,
    }

    enquiries = read_json(ENQUIRIES_FILE)
    enquiries.append(enquiry)
    write_json(ENQUIRIES_FILE, enquiries)

    whatsapp_status = "not_sent"
    whatsapp_error = None

    whatsapp_message = (
        "📩 New Website Enquiry - Life Care Point Laboratory\n\n"
        f"Name: {name}\n"
        f"Mobile: {mobile}\n"
        f"Source: {source}\n"
    )

    if message:
        whatsapp_message += f"\nMessage: {message}"

    try:
        send_admin_whatsapp(whatsapp_message)
        whatsapp_status = "sent"
    except Exception as error:
        whatsapp_status = "failed"
        whatsapp_error = str(error)
        print("WhatsApp enquiry notification failed:", error)

    return jsonify({
        "success": True,
        "message": "Your request has been submitted successfully.",
        "enquiry": enquiry,
        "whatsapp": whatsapp_status,
        "whatsappError": whatsapp_error,
    }), 201


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=True,
    )
