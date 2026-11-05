import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { toggleLightControlActive } from '~/features/light-control/actions';
import { isLightControlActive } from '~/features/light-control/selectors';
import { isConnected } from '~/features/servers/selectors';
import type { RootState } from '~/store/reducers';

type Props = {
  active: boolean;
  connected: boolean;
  onToggle: () => void;
};

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const LightControlMainSwitch = ({ active, connected, onToggle }: Props) => {
  const { t } = useTranslation();

  return (
    <ListItemButton
      disabled={!connected}
      onClick={connected ? onToggle : undefined}
    >
      <Switch checked={active && connected} />
      <ListItemText
        primary={
          connected
            ? active
              ? t('lightControl.fromGCS')
              : t('lightControl.notFromGCS')
            : t('lightControl.notConnected')
        }
        secondary={
          connected
            ? active
              ? t('lightControl.restoreDefault')
              : t('lightControl.takeControl')
            : t('lightControl.connectToAServer')
        }
      />
    </ListItemButton>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    active: isLightControlActive(state),
    connected: isConnected(state),
  }),
  // mapDispatchToProps
  {
    onToggle: toggleLightControlActive,
  }
)(LightControlMainSwitch);
