import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './de';
import en from './en';
import it from './it';
import hu from './hu';

export const availableLanguages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'hu', label: 'Magyar' },
];

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: 'en', // TODO: Make this an option in the config file
  resources: {
    de: { translation: de },
    en: { translation: en },
    it: { translation: it },
    hu: { translation: hu },
  },
});

export default i18n;

export const tt =
  (...args) =>
  (t) =>
    t(...args);
