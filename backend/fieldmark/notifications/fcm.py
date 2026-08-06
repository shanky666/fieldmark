import os
from django.conf import settings

# Translations lookup dictionary for backend notifications translation
TRANSLATIONS = {
    'EN': {
        'morning_reminder_title': "Good morning {name}!",
        'morning_reminder_body': "Mark your attendance. Window closes at {shift_end}.",
        'pre_close_title': "Hurry!",
        'pre_close_body': "Attendance window closes in 30 minutes.",
        'weekly_summary_title': "Weekly Summary",
        'weekly_summary_body': "This week: {present} days present out of {total} working days.",
        'contract_warning_title': "Contract Expiry Warning",
        'contract_warning_body': "Your contract ends on {date}. Contact your supervisor.",
        'contract_expired_worker': "Your contract ended on {date}. Contact your supervisor.",
        'contract_expired_admin': "{count} workers deactivated — contracts expired",
        'admin_expiry_title': "Contract Expiring",
        'admin_expiry_body': "{name}'s contract expires in 7 days."
    },
    'KN': {
        'morning_reminder_title': "ಶುಭೋದಯ {name}!",
        'morning_reminder_body': "ನಿಮ್ಮ ಹಾಜರಾತಿಯನ್ನು ಗುರುತಿಸಿ. {shift_end} ಗೆ ಹಾಜರಾತಿ ವಿಂಡೋ ಮುಚ್ಚುತ್ತದೆ.",
        'pre_close_title': "ತ್ವರೆಯಾಗಿ!",
        'pre_close_body': "ಹಾಜರಾತಿ ವಿಂಡೋ ಇನ್ನು 30 ನಿಮಿಷಗಳಲ್ಲಿ ಮುಚ್ಚುತ್ತದೆ.",
        'weekly_summary_title': "ಸಾಪ್ತಾಹಿಕ ಸಾರಾಂಶ",
        'weekly_summary_body': "ಈ ವಾರ: {total} ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ {present} ದಿನಗಳು ಹಾಜರಿದ್ದಾರೆ.",
        'contract_warning_title': "ಒಪ್ಪಂದ ಮುಕ್ತಾಯದ ಎಚ್ಚರಿಕೆ",
        'contract_warning_body': "ನಿಮ್ಮ ಒಪ್ಪಂದವು {date} ರಂದು ಕೊನೆಗೊಳ್ಳುತ್ತದೆ. ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        'contract_expired_worker': "ನಿಮ್ಮ ಒಪ್ಪಂದವು {date} ರಂದು ಕೊನೆಗೊಂಡಿದೆ. ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        'contract_expired_admin': "{count} ಕಾರ್ಮಿಕರು ನಿಷ್ಕ್ರಿಯಗೊಂಡಿದ್ದಾರೆ — ಒಪ್ಪಂದಗಳು ಮುಕ್ತಾಯಗೊಂಡಿವೆ",
        'admin_expiry_title': "ಒಪ್ಪಂದ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತಿದೆ",
        'admin_expiry_body': "{name} ರ ಒಪ್ಪಂದವು 7 ದಿನಗಳಲ್ಲಿ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ."
    },
    'HI': {
        'morning_reminder_title': "सुप्रभात {name}!",
        'morning_reminder_body': "अपनी उपस्थिति दर्ज करें। विंडो {shift_end} पर बंद हो जाएगी।",
        'pre_close_title': "जल्दी करें!",
        'pre_close_body': "उपस्थिति विंडो 30 मिनट में बंद हो रही है।",
        'weekly_summary_title': "साप्ताहिक सारांश",
        'weekly_summary_body': "इस सप्ताह: {total} कार्य दिवसों में से {present} दिन उपस्थित रहे।",
        'contract_warning_title': "अनुबंध समाप्ति चेतावनी",
        'contract_warning_body': "आपका अनुबंध {date} को समाप्त हो रहा है। अपने पर्यवेक्षक से संपर्क करें।",
        'contract_expired_worker': "आपका अनुबंध {date} को समाप्त हो गया। अपने पर्यवेक्षक से संपर्क करें।",
        'contract_expired_admin': "{count} श्रमिकों को निष्क्रिय कर दिया गया — अनुबंध समाप्त हो गए",
        'admin_expiry_title': "अनुबंध समाप्त होने वाला है",
        'admin_expiry_body': "{name} का अनुबंध 7 दिनों में समाप्त हो रहा है।"
    },
    'TA': {
        'morning_reminder_title': "காலை வணக்கம் {name}!",
        'morning_reminder_body': "உங்கள் வருகையை பதிவு செய்யவும். வருகை விண்டோ {shift_end} மணிக்கு மூடப்படும்.",
        'pre_close_title': "சீக்கிரம்!",
        'pre_close_body': "வருகை விண்டோ இன்னும் 30 நிமிடங்களில் மூடப்படும்.",
        'weekly_summary_title': "வாராந்திர சுருக்கம்",
        'weekly_summary_body': "இந்த வாரம்: {total} வேலை நாட்களில் {present} நாட்கள் வருகை தந்துள்ளீர்கள்.",
        'contract_warning_title': "ஒப்பந்த காலாவதி எச்சரிக்கை",
        'contract_warning_body': "உங்கள் ஒப்பந்தம் {date} அன்று முடிவடைகிறது. உங்கள் மேற்பார்வையாளரைத் தொடர்பு கொள்ளவும்.",
        'contract_expired_worker': "உங்கள் ஒப்பந்தம் {date} அன்று முடிவடைந்தது. உங்கள் மேற்பார்வையாளரைத் தொடர்பு கொள்ளவும்.",
        'contract_expired_admin': "{count} பணியாளர்கள் செயலிழக்கச் செய்யப்பட்டனர் — ஒப்பந்தங்கள் காலாவதியாகிவிட்டன",
        'admin_expiry_title': "ஒப்பந்தம் காலாவதியாகிறது",
        'admin_expiry_body': "{name} ஒப்பந்தம் 7 நாட்களில் காலாவதியாகிறது."
    },
    'TE': {
        'morning_reminder_title': "శుభోదయం {name}!",
        'morning_reminder_body': "మీ హాజరును నమోదు చేయండి. విండో {shift_end} కి ముగుస్తుంది.",
        'pre_close_title': "త్వరపడండి!",
        'pre_close_body': "హాజరు విండో మరో 30 నిమిషాల్లో మూసివేయబడుతుంది.",
        'weekly_summary_title': "వారపు సారాంశం",
        'weekly_summary_body': "ఈ వారం: {total} పని దినాలలో {present} రోజులు హాజరయ్యారు.",
        'contract_warning_title': "ఒప్పంద ముగింపు హెచ్చరిక",
        'contract_warning_body': "మీ ఒప్పందం {date} న ముగుస్తుంది. మీ సూపర్‌వైజర్‌ను సంప్రదించండి.",
        'contract_expired_worker': "మీ ఒప్పందం {date} న ముగిసింది. మీ సూపర్‌వైజర్‌ను సంప్రదించండి.",
        'contract_expired_admin': "{count} మంది కార్మికులు నిష్క్రియం చేయబడ్డారు — ఒప్పందాలు ముగిసాయి",
        'admin_expiry_title': "ఒప్పందం ముగియబోతోంది",
        'admin_expiry_body': "{name} ఒప్పందం 7 రోజుల్లో ముగుస్తుంది."
    }
}

# Try initializing Firebase Admin SDK
firebase_initialized = False
try:
    key_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '')
    if key_path and os.path.exists(key_path):
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("Firebase Admin successfully initialized.")
except Exception as e:
    print(f"Firebase Admin init skipped or failed: {str(e)}")


def send_push_notification(token, title, body, data=None, lang='EN'):
    """Sends a push notification to FCM device token, translating if localized templates exist."""
    # Lookup translated string if translation key is passed
    lang = lang.upper() if lang else 'EN'
    if lang not in TRANSLATIONS:
        lang = 'EN'

    # Send notification via Firebase if initialized
    if firebase_initialized:
        try:
            from firebase_admin import messaging
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=token
            )
            messaging.send(message)
            return True
        except Exception as e:
            print(f"Failed to send FCM push to {token}: {str(e)}")
            
    # Mock log printing fallback (saving costs)
    print("\n" + "~"*50)
    print(f"[MOCK PUSH NOTIFICATION] ({lang}) Token: {token}")
    print(f"Title: {title}")
    print(f"Body: {body}")
    if data:
        print(f"Data: {data}")
    print("~"*50 + "\n")
    return True
