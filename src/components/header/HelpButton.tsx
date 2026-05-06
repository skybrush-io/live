import Help from '@mui/icons-material/HelpOutline';
import { GenericHeaderButton } from '@skybrush/mui-components';
import { Translation } from 'react-i18next';

import { isHelpAvailable, showHelp } from '~/utils/help';

const HelpButton = () => (
  <Translation>
    {(t) => (
      <div onClick={isHelpAvailable ? showHelp : undefined}>
        <GenericHeaderButton tooltip={t('help')} disabled={!isHelpAvailable}>
          <Help />
        </GenericHeaderButton>
      </div>
    )}
  </Translation>
);

export default HelpButton;
