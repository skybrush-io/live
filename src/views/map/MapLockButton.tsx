import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { isMapLocked, toggleMapLock } from '~/features/map/tools';
import type { RootState } from '~/store/reducers';

type MapLockButtonProps = {
  locked: boolean;
  onToggle: () => void;
};

/**
 * Button that toggles whether the map is locked.
 */
const MapLockButton = ({ locked, onToggle }: MapLockButtonProps) => {
  const { t } = useTranslation();

  return (
    <Tooltip content={locked ? t('map.unlock') : t('map.lock')}>
      <IconButton
        size='large'
        color={locked ? 'primary' : undefined}
        onClick={onToggle}
      >
        {locked ? <Lock /> : <LockOpen />}
      </IconButton>
    </Tooltip>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    locked: isMapLocked(state),
  }),
  // mapDispatchToProps
  {
    onToggle: toggleMapLock,
  }
)(MapLockButton);
