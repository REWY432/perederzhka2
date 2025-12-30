import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import en from './locales/en.json';

const savedLocale = typeof window !== 'undefined' 
  ? localStorage.getItem('dogstay_locale') || 'ru' 
  : 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en }
    },
    lng: savedLocale,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    }
  });

export const changeLanguage = (lng: 'ru' | 'en') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('dogstay_locale', lng);
};

export default i18n;
