import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

/**
 * Component that updates the language of the application whenever the
 * respective setting changes in the state.
 */
const LanguageWatcher = ({ language }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  return null;
};

LanguageWatcher.propTypes = {
  language: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    language: state.settings.display.language,
  })
)(LanguageWatcher);
