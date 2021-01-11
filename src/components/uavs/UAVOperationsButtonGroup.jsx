import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import Assignment from '@material-ui/icons/Assignment';
import FlightLand from '@material-ui/icons/FlightLand';
import Home from '@material-ui/icons/Home';
import PowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import Refresh from '@material-ui/icons/Refresh';
import WbSunny from '@material-ui/icons/WbSunny';

import Colors from '~/components/colors';
import Tooltip from '~/components/Tooltip';

import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { createMultipleUAVRelatedActions } from '~/utils/messaging';

const useStyles = makeStyles(
  (theme) => ({
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5),
    },
  }),
  { name: 'UAVOperationsButtonGroup' }
);

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVOperationsButtonGroup = ({
  channel,
  openUAVDetailsDialog,
  selectedUAVIds,
  size,
}) => {
  const classes = useStyles();

  const isSelectionEmpty = isEmpty(selectedUAVIds);
  const isSelectionSingle = selectedUAVIds.length === 1;

  const {
    flashLightOnSelectedUAVs,
    haltSelectedUAVs,
    landSelectedUAVs,
    resetSelectedUAVs,
    returnToHomeSelectedUAVs,
    takeoffSelectedUAVs,
  } = createMultipleUAVRelatedActions(selectedUAVIds, { channel });

  const fontSize = size === 'small' ? 'small' : 'default';

  return (
    <>
      <Tooltip content='Takeoff'>
        <IconButton
          disabled={isSelectionEmpty}
          size={size}
          onClick={takeoffSelectedUAVs}
        >
          <FlightTakeoff fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Land'>
        <IconButton
          disabled={isSelectionEmpty}
          size={size}
          onClick={landSelectedUAVs}
        >
          <FlightLand fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Return to home'>
        <IconButton
          disabled={isSelectionEmpty}
          size={size}
          onClick={returnToHomeSelectedUAVs}
        >
          <Home fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      {size !== 'small' && (
        <Divider className={classes.divider} orientation='vertical' />
      )}

      {size !== 'small' && (
        <Tooltip content='Properties'>
          <IconButton
            disabled={!isSelectionSingle}
            size={size}
            onClick={() => openUAVDetailsDialog(selectedUAVIds[0])}
          >
            <Assignment />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip content='Flash lights'>
        <IconButton
          disabled={isSelectionEmpty}
          size={size}
          onClick={flashLightOnSelectedUAVs}
        >
          <WbSunny fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Divider className={classes.divider} orientation='vertical' />

      <Tooltip content='Reboot'>
        <IconButton
          disabled={isSelectionEmpty}
          size={size}
          onClick={resetSelectedUAVs}
        >
          <Refresh
            htmlColor={isSelectionEmpty ? undefined : Colors.error}
            disabled={isSelectionEmpty}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content='Power off'>
        <IconButton
          disabled={isSelectionEmpty}
          size={size}
          onClick={haltSelectedUAVs}
        >
          <PowerSettingsNew
            htmlColor={isSelectionEmpty ? undefined : Colors.error}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>
    </>
  );
};

UAVOperationsButtonGroup.propTypes = {
  channel: PropTypes.number,
  openUAVDetailsDialog: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  size: PropTypes.oneOf(['small', 'medium']),
};

UAVOperationsButtonGroup.defaultProps = {
  channel: 0,
};

export default connect(
  // mapStateToProps
  (state) => ({
    channel: getPreferredCommunicationChannelIndex(state),
  }),
  // mapDispatchToProps
  { openUAVDetailsDialog }
)(UAVOperationsButtonGroup);
