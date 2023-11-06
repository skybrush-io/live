import config from 'config';
import React from 'react';
import { Translation } from 'react-i18next';

import Help from '@material-ui/icons/HelpOutline';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

const showHelp = () => {
  if (config.urls.help) {
    window.open(config.urls.help, '_blank');
  }
};

const HelpButton = () => (
  <Translation>
    {(t) => (
      <GenericHeaderButton
        id='tour-help-button'
        tooltip={t('help')}
        onClick={showHelp}
      >
        <Help />
      </GenericHeaderButton>
    )}
  </Translation>
);

export default HelpButton;
