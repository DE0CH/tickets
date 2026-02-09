import json
import os
import secrets
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from email.message import EmailMessage
import smtplib

SMTP_HOST = "smtp.ox.ac.uk"
SMTP_PORT = 587
SENDER_EMAIL = "Deyao Chen <deyao.chen@reuben.ox.ac.uk>"
OXFORD_EMAIL_RE = re.compile(r"@([A-Za-z0-9-]+\.)*ox\.ac\.uk$", re.IGNORECASE)


def send_email(to_email, subject, text_body, html_body=None):
    username = os.environ.get("OX_SMTP_USER", "").strip()
    password = os.environ.get("OX_SMTP_PASS", "").strip()

    if not username or not password:
        raise ValueError("Missing OX_SMTP_USER or OX_SMTP_PASS.")

    msg = EmailMessage()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(text_body)

    if html_body:
        msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(username, password)
        server.send_message(msg)


def generate_code():
    return f"{secrets.randbelow(900000) + 100000}"


def is_oxford_email(email):
    return bool(OXFORD_EMAIL_RE.search(email))


class MailHandler(BaseHTTPRequestHandler):
    expected_token = None
    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/send_code":
            self._send_json(404, {"error": "Not found"})
            return

        auth_header = self.headers.get("Authorization", "")
        if not self.expected_token or auth_header != f"Bearer {self.expected_token}":
            self._send_json(401, {"error": "Unauthorized"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            data = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        to_email = (data.get("email") or "").strip()

        if not to_email:
            self._send_json(400, {"error": "email is required"})
            return
        if not is_oxford_email(to_email):
            self._send_json(400, {"error": "email must end with ox.ac.uk"})
            return

        try:
            code = generate_code()
            subject = "Your Verification Code for Tickets"
            text_body = f"Your verification code is: {code}"
            html_body = f"<strong>{code}</strong> is your verification code. It expires in 15 minutes."
            send_email(to_email, subject, text_body, html_body)
            self._send_json(200, {"code": code})
        except Exception as exc:
            self._send_json(500, {"error": str(exc)})


def run():
    host = os.environ.get("OX_MAIL_HOST", "0.0.0.0")
    port = int(os.environ.get("OX_MAIL_PORT", "8080"))
    try:
        expected_token = os.environ["OX_MAIL_API_TOKEN"].strip()
    except KeyError as exc:
        raise SystemExit("Missing OX_MAIL_API_TOKEN. Refusing to start.") from exc
    if not expected_token:
        raise SystemExit("Missing OX_MAIL_API_TOKEN. Refusing to start.")
    MailHandler.expected_token = expected_token
    server = HTTPServer((host, port), MailHandler)
    print(f"Oxford mail API listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
