import config from 'config';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './de';
import en from './en';
import es from './es';
import hu from './hu';
import it from './it';
import ja from './ja';
import nl from './nl';
import ro from './ro';
import zhHans from './zh-Hans';

// Labels (and sorting) based on: https://ux.stackexchange.com/q/37017/165102
const availableLanguages = [
  { label: 'Deutsch', code: 'de', translation: de },
  { label: 'English', code: 'en', translation: en },
  { label: 'Español', code: 'es', translation: es },
  { label: 'Italiano', code: 'it', translation: it },
  { label: 'Magyar', code: 'hu', translation: hu },
  { label: 'Nederlands', code: 'nl', translation: nl },
  { label: 'Română', code: 'ro', translation: ro },
  { label: '日本語', code: 'ja', translation: ja },
  { label: '中文', code: 'zh-Hans', translation: zhHans },
];

export const enabledLanguages = availableLanguages.filter(({ code }) =>
  config.language.enabled.has(code)
);

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  fallbackLng: config.language.fallback,
  lng: config.language.default,
  resources: Object.fromEntries(
    availableLanguages.map(({ code, translation }) => [code, { translation }])
  ),
});

export default i18n;

export const tt =
  (...args) =>
  (t) =>
    t(...args);
