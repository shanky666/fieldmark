from .base import *
import os

DEBUG = False

# Read ALLOWED_HOSTS from env in production
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
