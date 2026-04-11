import Help from '@mui/icons-material/HelpOutline';
import { GenericHeaderButton } from '@skybrush/mui-components';
import { Translation } from 'react-i18next';

import { isHelpAvailable, showHelp } from '~/utils/help';

const HelpButton = () => (
  <Translation>
    {(t) => (
      <GenericHeaderButton
        tooltip={t('help')}
        onClick={showHelp}
        disabled={!isHelpAvailable}
      >
        <Help />
      </GenericHeaderButton>
    )}
  </Translation>
);

export default HelpButton;
