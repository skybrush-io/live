import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import Shuffle from '@material-ui/icons/Shuffle';
import VerticalAlignBottom from '@material-ui/icons/VerticalAlignBottom';

import DronePlaceholderList from './DronePlaceholderList';

import DialogToolbar from '~/components/dialogs/DialogToolbar';
import {
  addVirtualDronesForMission,
  augmentMappingAutomaticallyFromSpareDrones
} from '~/features/mission/actions';
import { getEmptyMappingSlotIndices } from '~/features/mission/selectors';
import { supportsVirtualDrones } from '~/features/servers/selectors';
import { approveTakeoffArea } from '~/features/show/actions';
import { isTakeoffAreaApproved } from '~/features/show/selectors';
import {
  closeTakeoffAreaSetupDialog,
  revokeTakeoffAreaApproval
} from '~/features/show/slice';
import {
  createSelectorToGetUAVIdsTooFarFromHome,
  createSelectorToGetMisalignedUAVIds,
  getMissingUAVIdsInMapping
} from '~/features/uavs/selectors';

/**
 * Presentation component that shows how many mapping slots are empty at the
 * moment.
 */
const EmptySlotsIndicator = ({ indices }) => (
  <DronePlaceholderList
    items={indices}
    title="Empty slots:"
    successMessage="All slots in the mapping are filled."
  />
);

EmptySlotsIndicator.propTypes = {
  indices: PropTypes.arrayOf(PropTypes.number)
};

/**
 * Presentation component that shows which UAV IDs have been assigned to a mapping
 * slot such that the UAV itself does not seem to exist (i.e. we have received no
 * status report about them).
 */
const MissingDronesIndicator = ({ uavIds }) => (
  <DronePlaceholderList
    items={uavIds}
    title="Missing:"
    successMessage="All drones in the mapping are online."
  />
);

MissingDronesIndicator.propTypes = {
  uavIds: PropTypes.arrayOf(PropTypes.string)
};

/**
 * Presentation component that shows which UAVs seem to be placed at the wrong
 * place (far from its takeoff position).
 */
const MisplacedDronesIndicator = ({ uavIds }) => (
  <DronePlaceholderList
    items={uavIds}
    title="Misplaced:"
    successMessage="All drones are placed at their takeoff positions."
  />
);

MisplacedDronesIndicator.propTypes = {
  uavIds: PropTypes.arrayOf(PropTypes.string)
};

/**
 * Presentation component that shows which UAVs seem to be facing the wrong
 * direction.
 */
const MisalignedDronesIndicator = ({ uavIds }) => (
  <DronePlaceholderList
    items={uavIds}
    title="Misaligned:"
    successMessage="All drones are facing the correct direction."
  />
);

MisalignedDronesIndicator.propTypes = {
  uavIds: PropTypes.arrayOf(PropTypes.string)
};

/**
 * Presentation component for the dialog that allows the user to validate whether
 * all drones are properly placed in their takeoff positions.
 */
const TakeoffAreaSetupDialog = ({
  approved,
  emptySlotIndices,
  hasVirtualDrones,
  missingUAVIds,
  misplacedUAVIds,
  misalignedUAVIds,
  open,
  onAddVirtualDrones,
  onApprove,
  onAutomap,
  onClose,
  onRevoke
}) => (
  <Dialog fullWidth open={open} maxWidth="sm" onClose={onClose}>
    <DialogToolbar>
      <Typography noWrap variant="subtitle1">
        Takeoff area setup
      </Typography>
      <Box flex={1} />
      {hasVirtualDrones && (
        <Button
          startIcon={<VerticalAlignBottom />}
          onClick={onAddVirtualDrones}
        >
          Place virtual drones
        </Button>
      )}
      <IconButton onClick={onAutomap}>
        <Shuffle />
      </IconButton>
    </DialogToolbar>

    <DialogContent>
      <EmptySlotsIndicator indices={emptySlotIndices} />
      <MissingDronesIndicator uavIds={missingUAVIds} />
      <MisplacedDronesIndicator uavIds={misplacedUAVIds} />
      <MisalignedDronesIndicator uavIds={misalignedUAVIds} />

      <Box className="bottom-bar" textAlign="center" mt={2} pt={2}>
        <FormControlLabel
          control={
            <Switch
              checked={approved}
              value="approved"
              onChange={approved ? onRevoke : onApprove}
            />
          }
          label="Approve takeoff area arrangement"
        />
      </Box>
    </DialogContent>
    <DialogActions />
  </Dialog>
);

TakeoffAreaSetupDialog.propTypes = {
  approved: PropTypes.bool,
  emptySlotIndices: PropTypes.arrayOf(PropTypes.number),
  hasVirtualDrones: PropTypes.bool,
  missingUAVIds: PropTypes.arrayOf(PropTypes.string),
  misplacedUAVIds: PropTypes.arrayOf(PropTypes.string),
  misalignedUAVIds: PropTypes.arrayOf(PropTypes.string),
  onAddVirtualDrones: PropTypes.func,
  onApprove: PropTypes.func,
  onAutomap: PropTypes.func,
  onClose: PropTypes.func,
  onRevoke: PropTypes.func,
  open: PropTypes.bool
};

TakeoffAreaSetupDialog.defaultProps = {
  approved: false,
  open: false
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  () => {
    const getMisplacedUAVIds = createSelectorToGetUAVIdsTooFarFromHome(
      1 /* meter */
    );
    const getMisalignedUAVIds = createSelectorToGetMisalignedUAVIds(
      20 /* degrees */
    );
    return state => ({
      ...state.show.takeoffAreaSetupDialog,
      approved: isTakeoffAreaApproved(state),
      emptySlotIndices: getEmptyMappingSlotIndices(state),
      hasVirtualDrones: supportsVirtualDrones(state),
      missingUAVIds: getMissingUAVIdsInMapping(state),
      misplacedUAVIds: getMisplacedUAVIds(state),
      misalignedUAVIds: getMisalignedUAVIds(state)
    });
  },

  // mapDispatchToProps
  dispatch => ({
    onAddVirtualDrones() {
      dispatch(addVirtualDronesForMission());
    },

    onApprove() {
      dispatch(approveTakeoffArea());
      setTimeout(() => dispatch(closeTakeoffAreaSetupDialog()), 300);
    },

    onAutomap() {
      dispatch(augmentMappingAutomaticallyFromSpareDrones());
    },

    onClose() {
      dispatch(closeTakeoffAreaSetupDialog());
    },

    onRevoke() {
      dispatch(revokeTakeoffAreaApproval());
    }
  })
)(TakeoffAreaSetupDialog);
