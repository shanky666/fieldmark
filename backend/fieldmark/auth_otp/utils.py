import random
import hashlib
import string
from django.conf import settings

def generate_otp_code(length=6):
    """Generate a random numeric code."""
    return ''.join(random.choices(string.digits, k=length))


def hash_otp(otp):
    """Hash the OTP code using SHA-256."""
    return hashlib.sha256(otp.encode('utf-8')).hexdigest()


def generate_backup_codes(count=10, length=8):
    """Generate random numeric backup codes."""
    codes = []
    for _ in range(count):
        code = ''.join(random.choices(string.digits, k=length))
        codes.append(code)
    return codes


def send_sms_otp(phone, otp):
    """Send SMS verification code, defaulting to mock printing for local development."""
    message = f"Your FieldMark verification code is: {otp}. Valid for 5 minutes."
    
    if getattr(settings, 'USE_MOCK_SMS', True):
        print("\n" + "="*50)
        print(f"MOCK SMS SENT TO {phone}")
        print(message)
        print("="*50 + "\n")
        return True

    # Real implementation using Twilio
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    sender_phone = getattr(settings, 'TWILIO_PHONE_NUMBER', '')

    if account_sid and auth_token and sender_phone:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(
                body=message,
                from_=sender_phone,
                to=phone
            )
            return True
        except Exception as e:
            print(f"Twilio failed to send SMS to {phone}: {str(e)}")
            # Fallback to printing in logs so developers aren't blocked
            print(f"[Fallback Print] SMS OTP for {phone}: {otp}")
            return False
    else:
        print(f"[Credentials Missing Print] SMS OTP for {phone}: {otp}")
        return False
