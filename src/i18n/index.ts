import config from 'config';

import i18next, { type TOptions, type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { type NestedRecord } from '~/utils/types';

import * as de from './de.json';
import * as en from './en.json';
import * as es from './es.json';
import * as fr from './fr.json';
import * as hu from './hu.json';
import * as it from './it.json';
import * as ja from './ja.json';
import * as ko from './ko.json';
import * as nl from './nl.json';
import * as pl from './pl.json';
import * as ro from './ro.json';
import * as ru from './ru.json';
import * as zhHans from './zh-Hans.json';

/* Languages */

type Language = {
  label: string;
  code: string;
  translation: NestedRecord<string>;
};

// Labels (and sorting) based on: https://ux.stackexchange.com/q/37017/165102
const availableLanguages: Language[] = [
  { label: 'Deutsch', code: 'de', translation: de },
  { label: 'English', code: 'en', translation: en },
  { label: 'Español', code: 'es', translation: es },
  { label: 'Français', code: 'fr', translation: fr },
  { label: 'Italiano', code: 'it', translation: it },
  { label: 'Magyar', code: 'hu', translation: hu },
  { label: 'Nederlands', code: 'nl', translation: nl },
  { label: 'Polski', code: 'pl', translation: pl },
  { label: 'Română', code: 'ro', translation: ro },
  { label: 'Русский', code: 'ru', translation: ru },
  { label: '中文', code: 'zh-Hans', translation: zhHans },
  { label: '日本語', code: 'ja', translation: ja },
  { label: '한국어', code: 'ko', translation: ko },
];

export const enabledLanguages = availableLanguages.filter(({ code }) =>
  config.language.enabled.has(code)
);

/* Instance */

const i18n = i18next.createInstance();
await i18n.use(initReactI18next).init({
  fallbackLng: config.language.fallback,
  lng: config.language.default,
  resources: Object.fromEntries(
    availableLanguages.map(({ code, translation }) => [code, { translation }])
  ),
});

export default i18n;

/* Utilities */

export type PreparedI18nKey = (t: TFunction) => string;

// NOTE: `(...args: Parameters<TFunction>)` doesn't work, as per:
// https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype
// "For overloaded functions, this will be the parameters of the last signature;"
export const tt =
  (key: string, options?: TOptions): PreparedI18nKey =>
  (t: TFunction) =>
    options ? t(key, options) : t(key);
