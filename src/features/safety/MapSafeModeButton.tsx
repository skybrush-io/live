/**
 * @file React component to toggle the safe mode of the main map, guarding it
 * against accidental edits.
 */

import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import type { RootState } from '~/store/reducers';

import { toggleMapSafeMode } from './slice';
import { isMapInSafeMode } from './selectors';

type MapSafeModeButtonProps = {
  safeMode: boolean;
  onToggle?: () => void;
};

const MapSafeModeButton = ({ onToggle, safeMode }: MapSafeModeButtonProps) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      content={
        safeMode
          ? t('mapSafeModeButton.disable')
          : t('mapSafeModeButton.enable')
      }
    >
      <IconButton
        size='large'
        color={safeMode ? 'primary' : undefined}
        onClick={onToggle}
      >
        {safeMode ? <Lock /> : <LockOpen />}
      </IconButton>
    </Tooltip>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    safeMode: isMapInSafeMode(state),
  }),
  // mapDispatchToProps
  {
    onToggle: toggleMapSafeMode,
  }
)(MapSafeModeButton);
