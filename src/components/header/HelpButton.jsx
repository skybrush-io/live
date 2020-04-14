import config from 'config';

import Help from '@material-ui/icons/HelpOutline';

const showHelp = () => {
  if (config.helpUrl) {
    window.open(config.helpUrl, '_blank');
  }
};

const HelpButton = () => (
  <div className='wb-module' id='tour-help-button' onClick={showHelp}>
    <span className='wb-icon wb-module-icon'>
      <Help />
    </span>
  </div>
);

export default HelpButton;
