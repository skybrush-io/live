import AdsClick from '@mui/icons-material/AdsClick';

import Cast from '@mui/icons-material/Cast';

import Clear from '@mui/icons-material/Clear';

import PositionHold from '@mui/icons-material/Flag';

import FlightLand from '@mui/icons-material/FlightLand';

import FlightTakeoff from '@mui/icons-material/FlightTakeoff';

import Home from '@mui/icons-material/Home';

import PlayArrow from '@mui/icons-material/PlayArrow';

import PowerSettingsNew from '@mui/icons-material/PowerSettingsNew';

import RocketLaunch from '@mui/icons-material/RocketLaunch';

import Box from '@mui/material/Box';

import ButtonBase from '@mui/material/ButtonBase';

import ToggleButton from '@mui/material/ToggleButton';

import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import Typography from '@mui/material/Typography';

import { deepPurple } from '@mui/material/colors';

import createColor from 'color';

import { bindActionCreators } from '@reduxjs/toolkit';

import PropTypes from 'prop-types';

import React, { useCallback, useMemo, useState } from 'react';

import { withTranslation } from 'react-i18next';

import { connect } from 'react-redux';



import { makeStyles } from '@skybrush/app-theme-mui';



import Colors from '~/components/colors';

import ConfirmationDialog from '~/components/dialogs/ConfirmationDialog';

import {

  areFlightCommandsBroadcast,

  getPreferredCommunicationChannelIndex,

  getUAVIdsParticipatingInMission,

} from '~/features/mission/selectors';

import { setCommandsAreBroadcast } from '~/features/mission/slice';

import { getSelectedUAVIds } from '~/features/uavs/selectors';

import { createUAVOperationThunks } from '~/utils/messaging';



const useStyles = makeStyles((theme) => ({

  commandDeck: {

    display: 'flex',

    flexDirection: 'column',

    gap: theme.spacing(1.25),

    padding: theme.spacing(0, 1.25, 1.25),

  },



  modeHint: {

    color: theme.palette.text.secondary,

    letterSpacing: '0.01em',

    lineHeight: 1.3,

    minHeight: '2.6em',

    textAlign: 'center',

  },



  modeToggle: {

    width: '100%',



    '& .MuiToggleButton-root': {

      flex: 1,

      gap: theme.spacing(0.5),

      letterSpacing: '0.02em',

      lineHeight: 1.2,

      padding: theme.spacing(0.75, 0.5),

      textTransform: 'none',

    },

  },



  modeToggleIcon: {

    fontSize: '1.1rem',

  },



  section: {

    display: 'flex',

    flexDirection: 'column',

    gap: theme.spacing(0.75),

  },



  sectionLabel: {

    color: theme.palette.text.secondary,

    fontSize: '0.65rem',

    fontWeight: 700,

    letterSpacing: '0.12em',

    lineHeight: 1,

    textTransform: 'uppercase',

  },



  buttonRow: {

    display: 'grid',

    gap: theme.spacing(0.75),

    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',

  },



  deckButton: {

    alignItems: 'center',

    borderRadius: theme.spacing(1.25),

    boxShadow: '0 2px 0 rgba(0, 0, 0, 0.18)',

    boxSizing: 'border-box',

    display: 'flex',

    gap: theme.spacing(0.75),

    justifyContent: 'flex-start',

    minHeight: 56,

    padding: theme.spacing(0.75, 0.875),

    textAlign: 'left',

    transition: theme.transitions.create(['filter', 'transform', 'box-shadow'], {

      duration: theme.transitions.duration.short,

    }),

    width: '100%',



    '&:hover': {

      boxShadow: theme.shadows[4],

      filter: 'brightness(1.05)',

      transform: 'translateY(-1px)',

    },



    '&:active': {

      boxShadow: '0 1px 0 rgba(0, 0, 0, 0.18)',

      transform: 'translateY(0)',

    },

  },



  deckButtonIconWrap: {

    alignItems: 'center',

    borderRadius: theme.spacing(0.75),

    display: 'flex',

    flexShrink: 0,

    height: 36,

    justifyContent: 'center',

    width: 36,

  },



  deckButtonIcon: {

    fontSize: '1.35rem',

  },



  deckButtonText: {

    display: 'flex',

    flexDirection: 'column',

    gap: 2,

    minWidth: 0,

  },



  deckButtonLabel: {

    fontSize: '0.68rem',

    fontWeight: 700,

    letterSpacing: '0.05em',

    lineHeight: 1.15,

    textTransform: 'uppercase',

  },



  deckButtonHint: {

    fontSize: '0.58rem',

    fontWeight: 500,

    letterSpacing: '0.02em',

    lineHeight: 1.1,

    opacity: 0.82,

    textTransform: 'none',

  },

  bottomBarDeck: {
    display: 'flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    minWidth: 0,
    padding: theme.spacing(0, 1, 0.875),
  },

  bottomBarGrid: {
    display: 'grid',
    flex: '0 0 auto',
    gap: 'clamp(4px, 0.5vw, 6px)',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(2, auto)',
    width: '100%',
  },

  bottomBarButton: {
    alignItems: 'center',
    borderRadius: theme.spacing(0.75),
    boxShadow: '0 2px 0 rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box',
    display: 'flex',
    gap: 'clamp(3px, 0.4vw, 6px)',
    justifyContent: 'flex-start',
    minHeight: 'clamp(40px, 5vh, 48px)',
    minWidth: 0,
    overflow: 'hidden',
    padding: 'clamp(4px, 0.5vw, 6px) clamp(5px, 0.6vw, 8px)',
    textAlign: 'left',
    transition: theme.transitions.create(['filter', 'transform'], {
      duration: theme.transitions.duration.short,
    }),
    width: '100%',

    '&:hover': {
      filter: 'brightness(1.06)',
      transform: 'translateY(-1px)',
    },
  },

  bottomBarButtonIcon: {
    flexShrink: 0,
    fontSize: 'clamp(1.1rem, 1.35vw, 1.25rem)',
  },

  bottomBarButtonLabel: {
    fontSize: 'clamp(0.68rem, 0.9vw, 0.76rem)',
    fontWeight: 700,
    letterSpacing: '0.03em',
    lineHeight: 1.1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

}));



const BOTTOM_BAR_BUTTONS = Object.freeze([
  {
    key: 'turnMotorsOn',
    color: Colors.success,
    icon: PlayArrow,
    labelKey: 'arm',
  },
  {
    key: 'turnMotorsOff',
    color: Colors.info,
    icon: Clear,
    labelKey: 'disarm',
  },
  {
    key: 'takeOff',
    color: Colors.success,
    icon: FlightTakeoff,
    labelKey: 'takeoff',
  },
  {
    key: 'startShow',
    color: deepPurple[500],
    icon: RocketLaunch,
    labelKey: 'showStart',
  },
  {
    key: 'holdPosition',
    color: Colors.positionHold,
    icon: PositionHold,
    labelKey: 'hold',
  },
  {
    key: 'returnToHome',
    color: Colors.warning,
    icon: Home,
    labelKey: 'RTH',
  },
  {
    key: 'land',
    color: Colors.seriousWarning,
    icon: FlightLand,
    labelKey: 'land',
  },
  {
    key: 'shutdown',
    color: Colors.error,
    icon: PowerSettingsNew,
    labelKey: 'shutdown',
  },
]);

const COMMAND_SECTIONS = Object.freeze([

  {

    labelKey: 'sectionMotors',

    buttons: Object.freeze([

      {

        key: 'turnMotorsOn',

        color: Colors.success,

        hintKey: 'hintArm',

        icon: PlayArrow,

        labelKey: 'arm',

      },

      {

        key: 'turnMotorsOff',

        color: Colors.info,

        hintKey: 'hintDisarm',

        icon: Clear,

        labelKey: 'disarm',

      },

    ]),

  },

  {

    labelKey: 'sectionFlight',

    buttons: Object.freeze([

      {

        key: 'takeOff',

        color: Colors.success,

        hintKey: 'hintTakeoff',

        icon: FlightTakeoff,

        labelKey: 'takeoff',

      },

      {

        key: 'startShow',

        color: deepPurple[500],

        hintKey: 'hintShowStart',

        icon: RocketLaunch,

        labelKey: 'showStart',

      },

      {

        key: 'holdPosition',

        color: Colors.positionHold,

        hintKey: 'hintHold',

        icon: PositionHold,

        labelKey: 'hold',

      },

      {

        key: 'returnToHome',

        color: Colors.warning,

        hintKey: 'hintRTH',

        icon: Home,

        labelKey: 'RTH',

      },

    ]),

  },

  {

    labelKey: 'sectionEnd',

    buttons: Object.freeze([

      {

        key: 'land',

        color: Colors.seriousWarning,

        hintKey: 'hintLand',

        icon: FlightLand,

        labelKey: 'land',

      },

      {

        key: 'shutdown',

        color: Colors.error,

        hintKey: 'hintShutdown',

        icon: PowerSettingsNew,

        labelKey: 'shutdown',

      },

    ]),

  },

]);

const COMMAND_CONFIRM_LABEL_KEYS = Object.freeze({
  turnMotorsOn: 'arm',
  turnMotorsOff: 'disarm',
  takeOff: 'takeoff',
  startShow: 'showStart',
  holdPosition: 'hold',
  returnToHome: 'RTH',
  land: 'land',
  shutdown: 'shutdown',
});

const chunkButtons = (buttons) => {

  const rows = [];



  for (let index = 0; index < buttons.length; index += 2) {

    rows.push(buttons.slice(index, index + 2));

  }



  return rows;

};



const FlightDeckButton = ({ button, classes, label, hint, onClick }) => {

  const Icon = button.icon;

  const parsedColor = useMemo(() => createColor(button.color), [button.color]);

  const foreground = parsedColor.isLight()

    ? 'rgba(0, 0, 0, 0.87)'

    : 'rgba(255, 255, 255, 0.95)';

  const iconBackdrop = parsedColor.isLight()

    ? 'rgba(0, 0, 0, 0.08)'

    : 'rgba(255, 255, 255, 0.2)';



  return (

    <ButtonBase

      aria-label={label}

      className={classes.deckButton}

      onClick={onClick}

      sx={{

        backgroundColor: button.color,

        border: `2px solid ${parsedColor.darken(0.2).alpha(0.35).string()}`,

        color: foreground,

        '&:hover': {

          backgroundColor: parsedColor.darken(0.08).string(),

        },

      }}

    >

      <Box

        className={classes.deckButtonIconWrap}

        sx={{ backgroundColor: iconBackdrop }}

      >

        <Icon className={classes.deckButtonIcon} />

      </Box>

      <Box className={classes.deckButtonText}>

        <Typography className={classes.deckButtonLabel} component='span'>

          {label}

        </Typography>

        {hint ? (

          <Typography className={classes.deckButtonHint} component='span'>

            {hint}

          </Typography>

        ) : null}

      </Box>

    </ButtonBase>

  );

};



FlightDeckButton.propTypes = {

  button: PropTypes.shape({

    color: PropTypes.string.isRequired,

    icon: PropTypes.elementType.isRequired,

    key: PropTypes.string.isRequired,

  }).isRequired,

  classes: PropTypes.object.isRequired,

  hint: PropTypes.string,

  label: PropTypes.string.isRequired,

  onClick: PropTypes.func.isRequired,

};



const BottomBarCommandButton = ({ button, classes, label, onClick }) => {
  const Icon = button.icon;
  const parsedColor = useMemo(() => createColor(button.color), [button.color]);
  const foreground = parsedColor.isLight()
    ? 'rgba(0, 0, 0, 0.87)'
    : 'rgba(255, 255, 255, 0.95)';

  return (
    <ButtonBase
      aria-label={label}
      className={classes.bottomBarButton}
      onClick={onClick}
      sx={{
        backgroundColor: button.color,
        border: `1px solid ${parsedColor.darken(0.18).alpha(0.35).string()}`,
        color: foreground,
        '&:hover': {
          backgroundColor: parsedColor.darken(0.06).string(),
        },
      }}
    >
      <Icon className={classes.bottomBarButtonIcon} />
      <Typography className={classes.bottomBarButtonLabel} component='span'>
        {label}
      </Typography>
    </ButtonBase>
  );
};

BottomBarCommandButton.propTypes = {
  button: PropTypes.shape({
    color: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    key: PropTypes.string.isRequired,
  }).isRequired,
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

const LargeControlButtonGroup = ({

  broadcast,

  onChangeBroadcastMode,

  t,

  uavActions,

  variant = 'deck',

}) => {

  const classes = useStyles();

  const mode = broadcast ? 'broadcast' : 'selection';

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pendingCommand, setPendingCommand] = useState(null);

  const requestCommand = useCallback((commandKey) => {

    setPendingCommand(commandKey);

    setConfirmOpen(true);

  }, []);

  const handleConfirmClose = useCallback(() => {

    setConfirmOpen(false);

    setPendingCommand(null);

  }, []);

  const handleConfirmAction = useCallback(() => {

    if (!pendingCommand || !uavActions[pendingCommand]) {

      return;

    }

    uavActions[pendingCommand]({ skipUAVOperationConfirmation: true });

    handleConfirmClose();

  }, [pendingCommand, uavActions, handleConfirmClose]);

  const confirmMessage = useMemo(() => {

    if (!pendingCommand) {

      return '';

    }

    const labelKey = COMMAND_CONFIRM_LABEL_KEYS[pendingCommand];

    const commandLabel = labelKey

      ? t(`largeControlButtonGroup.${labelKey}`)

      : pendingCommand;

    return broadcast

      ? t('largeControlButtonGroup.confirmCommandMessageBroadcast', {

          command: commandLabel,

        })

      : t('largeControlButtonGroup.confirmCommandMessage', {

          command: commandLabel,

        });

  }, [broadcast, pendingCommand, t]);

  if (variant === 'bottomBar') {
    return (
      <Box className={classes.bottomBarDeck}>
        <Box className={classes.bottomBarGrid}>
          {BOTTOM_BAR_BUTTONS.map((button) => (
            <BottomBarCommandButton
              key={button.key}
              button={button}
              classes={classes}
              label={t(`largeControlButtonGroup.${button.labelKey}`)}
              onClick={() => requestCommand(button.key)}
            />
          ))}
        </Box>

        <ConfirmationDialog
          open={confirmOpen}
          message={confirmMessage}
          onConfirm={handleConfirmAction}
          onCancel={handleConfirmClose}
        />
      </Box>
    );
  }

  return (

    <Box className={classes.commandDeck}>

      <ToggleButtonGroup

        exclusive

        fullWidth

        aria-label={t('largeControlButtonGroup.modeToggleLabel')}

        className={classes.modeToggle}

        color='primary'

        size='small'

        value={mode}

        onChange={onChangeBroadcastMode}

      >

        <ToggleButton

          aria-label={t('largeControlButtonGroup.selectionOnly')}

          value='selection'

        >

          <AdsClick className={classes.modeToggleIcon} />

          {t('largeControlButtonGroup.modeSelection')}

        </ToggleButton>

        <ToggleButton

          aria-label={t('largeControlButtonGroup.broadcast')}

          value='broadcast'

        >

          <Cast className={classes.modeToggleIcon} />

          {t('largeControlButtonGroup.modeBroadcast')}

        </ToggleButton>

      </ToggleButtonGroup>



      <Typography className={classes.modeHint} variant='caption'>

        {broadcast

          ? t('largeControlButtonGroup.targetBroadcast')

          : t('largeControlButtonGroup.targetSelection')}

      </Typography>



      {COMMAND_SECTIONS.map((section) => (

        <Box key={section.labelKey} className={classes.section}>

          <Typography className={classes.sectionLabel} component='div'>

            {t(`largeControlButtonGroup.${section.labelKey}`)}

          </Typography>



          {chunkButtons(section.buttons).map((rowButtons, rowIndex) => (

            <Box key={rowIndex} className={classes.buttonRow}>

              {rowButtons.map((button) => (

                <FlightDeckButton

                  key={button.key}

                  button={button}

                  classes={classes}

                  hint={t(`largeControlButtonGroup.${button.hintKey}`)}

                  label={t(`largeControlButtonGroup.${button.labelKey}`)}

                  onClick={() => requestCommand(button.key)}

                />

              ))}

            </Box>

          ))}

        </Box>

      ))}

      <ConfirmationDialog

        open={confirmOpen}

        message={confirmMessage}

        onConfirm={handleConfirmAction}

        onCancel={handleConfirmClose}

      />

    </Box>

  );

};



LargeControlButtonGroup.propTypes = {

  broadcast: PropTypes.bool,

  onChangeBroadcastMode: PropTypes.func,

  t: PropTypes.func,

  uavActions: PropTypes.objectOf(PropTypes.func),

  variant: PropTypes.oneOf(['deck', 'bottomBar']),

};



export default connect(

  // mapStateToProps

  (state) => ({

    allUAVIdsInMission: getUAVIdsParticipatingInMission(state),

    broadcast: areFlightCommandsBroadcast(state),

    channel: getPreferredCommunicationChannelIndex(state),

    selectedUAVIds: getSelectedUAVIds(state),

  }),

  // mapDispatchToProps

  (dispatch) => ({

    onChangeBroadcastMode: (_event, value) => {

      if (value) {

        dispatch(setCommandsAreBroadcast(value === 'broadcast'));

      }

    },



    uavActions: bindActionCreators(

      createUAVOperationThunks({

        getTargetedUAVIds(state) {

          const broadcast = areFlightCommandsBroadcast(state);

          return broadcast

            ? getUAVIdsParticipatingInMission(state)

            : getSelectedUAVIds(state);

        },



        getTransportOptions(state) {

          return {

            channel: getPreferredCommunicationChannelIndex(state),

            broadcast: areFlightCommandsBroadcast(state),

          };

        },

      }),

      dispatch

    ),

  })

)(withTranslation()(LargeControlButtonGroup));


