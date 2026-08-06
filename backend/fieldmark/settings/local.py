from .base import *

DEBUG = True

if os.name == 'nt':
    try:
        from django.contrib.gis.gdal import libgdal
    except Exception:
        if 'django.contrib.gis' in INSTALLED_APPS:
            INSTALLED_APPS.remove('django.contrib.gis')
        if not os.environ.get('DATABASE_URL'):
            DATABASES['default'] = {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        else:
            DATABASES['default']['ENGINE'] = 'django.db.backends.postgresql'


