import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en';
import hu from './hu';

export const availableLanguages = [
  { code: 'en', label: 'English' },
  { code: 'hu', label: 'Magyar' },
];

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: 'en', // TODO: Make this an option in the config file
  resources: {
    en: { translation: en },
    hu: { translation: hu },
  },
});

export default i18n;

export const tt =
  (...args) =>
  (t) =>
    t(...args);
