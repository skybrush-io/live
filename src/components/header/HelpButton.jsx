import config from 'config';
import React from 'react';

import Help from '@material-ui/icons/HelpOutline';

import GenericHeaderButton from './GenericHeaderButton';

const showHelp = () => {
  if (config.urls.help) {
    window.open(config.urls.help, '_blank');
  }
};

const HelpButton = () => (
  <GenericHeaderButton id='tour-help-button' tooltip='Help' onClick={showHelp}>
    <Help />
  </GenericHeaderButton>
);

export default HelpButton;
