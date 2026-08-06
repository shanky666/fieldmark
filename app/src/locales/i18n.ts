import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Locale resources import
import en from './en.json';
import kn from './kn.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
      ta: { translation: ta },
      te: { translation: te }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    }
  });

export default i18n;
