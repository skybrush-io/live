import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './de';
import en from './en';
import es from './es';
import hu from './hu';
import it from './it';

// Labels (and sorting) based on: https://ux.stackexchange.com/q/37017/165102
export const availableLanguages = [
  { label: 'Deutsch', code: 'de', translation: de },
  { label: 'English', code: 'en', translation: en },
  { label: 'Español', code: 'es', translation: es },
  { label: 'Italiano', code: 'it', translation: it },
  { label: 'Magyar', code: 'hu', translation: hu },
];

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  lng: 'en', // TODO: Make this an option in the config file
  resources: Object.fromEntries(
    availableLanguages.map(({ code, translation }) => [code, { translation }])
  ),
});

export default i18n;

export const tt =
  (...args) =>
  (t) =>
    t(...args);
