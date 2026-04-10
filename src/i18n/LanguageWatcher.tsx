import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { getDisplayLanguage } from '~/features/settings/selectors';

/**
 * Component that updates the language of the application whenever the
 * respective setting changes in the state.
 */
const LanguageWatcher = () => {
  const { i18n } = useTranslation();
  const language = useSelector(getDisplayLanguage);

  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [i18n, language]);

  return null;
};

export default LanguageWatcher;
