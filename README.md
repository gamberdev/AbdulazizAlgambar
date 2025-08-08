# Beauty Center Reservation App

A Flask-based reservation and appointment management app for beauty centers featuring:
- Visual calendar (FullCalendar)
- WhatsApp notifications (via Twilio WhatsApp Business API)
- Daily and monthly sales reports
- CRUD for customers, services, and appointments
- Simple settings (business hours, WhatsApp on/off)

## Features
- Calendar view of appointments with drag-to-view.
- Create, update, cancel appointments.
- Customers and services management.
- WhatsApp notifications for appointment confirmation/updates (optional; requires credentials).
- Daily/monthly reservation sales reports.

## Tech Stack
- Python 3.10+
- Flask, SQLAlchemy (SQLite by default)
- Bootstrap 5 + FullCalendar
- Twilio (WhatsApp) integration via environment variables

## Setup

1. Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment variables (copy `.env.example` to `.env` and adjust):

```bash
cp .env.example .env
```

3. Initialize and run the app:

```bash
export FLASK_APP=run.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
```

Or run directly:

```bash
python run.py
```

The app will create the SQLite database automatically on first run at `instance/app.db`.

## Environment Variables

- `DATABASE_URL` (optional): SQLAlchemy database URL. Defaults to `sqlite:///app.db` inside `instance/`.
- `SECRET_KEY`: Flask secret key.
- `ENABLE_WHATSAPP` (optional): `true`/`false` to enable WhatsApp notifications.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`: For WhatsApp notifications (sender must be `whatsapp:+...`).

## Notes on WhatsApp
- You must have a WhatsApp Business API number (e.g., via Twilio) and approved templates.
- The app sends simple confirmation/update messages on appointment creation/update if enabled.

## Reports
- Daily and monthly reports show counts and total revenue from booked/completed appointments.
- Cancelled/no-show appointments are excluded from revenue.

## Seed Data (optional)
You can create customers, services, and appointments via the UI. No preseed script is required.

## License
MIT
