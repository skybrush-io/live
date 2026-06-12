import AdsClick from '@mui/icons-material/AdsClick';
import Cast from '@mui/icons-material/Cast';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import { areFlightCommandsBroadcast } from '~/features/mission/selectors';
import { setCommandsAreBroadcast } from '~/features/mission/slice';

const useStyles = makeStyles((theme) => ({
  group: {
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    flexShrink: 0,
    padding: 2,

    '& .MuiToggleButtonGroup-grouped': {
      border: 0,
      margin: 0,
    },

    '& .MuiToggleButton-root': {
      border: '1px solid transparent',
      borderRadius: '999px !important',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '0.74rem',
      fontWeight: 600,
      gap: theme.spacing(0.375),
      letterSpacing: '0.02em',
      lineHeight: 1,
      minHeight: 30,
      padding: theme.spacing(0.45, 0.875),
      textTransform: 'none',

      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },

      '&.Mui-selected': {
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
        color: '#fff',
        fontWeight: 700,
      },
    },
  },
  modeSelection: {
    '&.Mui-selected': {
      backgroundColor: '#2f80ed !important',
      borderColor: '#5ca0ff !important',
    },
  },
  modeBroadcast: {
    '&.Mui-selected': {
      backgroundColor: '#d97b16 !important',
      borderColor: '#f0a04a !important',
    },
  },
  modeIcon: {
    fontSize: '1.15rem',
  },
}));

const FlightCommandTargetToggle = ({
  broadcast,
  onChangeBroadcastMode,
  t,
}) => {
  const classes = useStyles();
  const mode = broadcast ? 'broadcast' : 'selection';

  const selectionTip = `${t('largeControlButtonGroup.modeSelection')} — ${t(
    'largeControlButtonGroup.targetSelection'
  )}`;
  const broadcastTip = `${t('largeControlButtonGroup.modeBroadcast')} — ${t(
    'largeControlButtonGroup.targetBroadcast'
  )}`;

  return (
    <ToggleButtonGroup
      exclusive
      aria-label={t('largeControlButtonGroup.modeToggleLabel')}
      className={classes.group}
      size='small'
      value={mode}
      onChange={onChangeBroadcastMode}
    >
      <Tooltip placement='top' title={selectionTip}>
        <ToggleButton
          aria-label={t('largeControlButtonGroup.selectionOnly')}
          className={classes.modeSelection}
          value='selection'
        >
          <AdsClick className={classes.modeIcon} />
          <span>{t('largeControlButtonGroup.modeSelection')}</span>
        </ToggleButton>
      </Tooltip>
      <Tooltip placement='top' title={broadcastTip}>
        <ToggleButton
          aria-label={t('largeControlButtonGroup.broadcast')}
          className={classes.modeBroadcast}
          value='broadcast'
        >
          <Cast className={classes.modeIcon} />
          <span>{t('largeControlButtonGroup.modeBroadcast')}</span>
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
};

FlightCommandTargetToggle.propTypes = {
  broadcast: PropTypes.bool,
  onChangeBroadcastMode: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  (state) => ({
    broadcast: areFlightCommandsBroadcast(state),
  }),
  (dispatch) => ({
    onChangeBroadcastMode: (_event, value) => {
      if (value) {
        dispatch(setCommandsAreBroadcast(value === 'broadcast'));
      }
    },
  })
)(withTranslation()(FlightCommandTargetToggle));
