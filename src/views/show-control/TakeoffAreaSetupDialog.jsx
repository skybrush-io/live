import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import { getEmptyMappingSlotIndices } from '~/features/mission/selectors';
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
import { formatMissionId } from '~/utils/formatting';

/**
 * Presentation component that receives a list of mapping slot indices and
 * formats them nicely, truncating the list as appropriate if it is too long.
 */
const SlotList = ({ indices, successMessage, title }) => (
  <Box mt={1}>
    <Box display="flex" flexDirection="row" alignItems="center">
      <Box key="lead" minWidth={85}>
        {title}
      </Box>
      {indices.slice(0, 8).map(index => (
        <Box key={index} ml={1}>
          <DronePlaceholder
            label={
              typeof index === 'number' ? formatMissionId(index) : String(index)
            }
          />
        </Box>
      ))}
      {indices.length > 8 ? (
        <Box key="more" ml={1} color="text.secondary">
          <Typography variant="body2">+ {indices.length - 8} more</Typography>
        </Box>
      ) : null}
      {indices.length === 0 ? (
        <>
          <Box key="ok" ml={1}>
            <DronePlaceholder label="OK" status="success" />
          </Box>
          <Box key="successMessage" color="success.main" ml={1}>
            <Typography variant="body2">{successMessage}</Typography>
          </Box>
        </>
      ) : null}
    </Box>
  </Box>
);

SlotList.propTypes = {
  indices: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ),
  successMessage: PropTypes.node,
  title: PropTypes.string
};

/**
 * Presentation component that shows how many mapping slots are empty at the
 * moment.
 */
const EmptySlotsIndicator = ({ indices }) => (
  <SlotList
    indices={indices}
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
  <SlotList
    indices={uavIds}
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
  <SlotList
    indices={uavIds}
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
  <SlotList
    indices={uavIds}
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
  missingUAVIds,
  misplacedUAVIds,
  misalignedUAVIds,
  open,
  onApprove,
  onClose,
  onRevoke
}) => (
  <Dialog fullWidth open={open} maxWidth="sm" onClose={onClose}>
    <DialogContent>
      <EmptySlotsIndicator indices={emptySlotIndices} />
      <MissingDronesIndicator uavIds={missingUAVIds} />
      <MisplacedDronesIndicator uavIds={misplacedUAVIds} />
      <MisalignedDronesIndicator uavIds={misalignedUAVIds} />

      <Box textAlign="center" mt={2}>
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
  missingUAVIds: PropTypes.arrayOf(PropTypes.string),
  misplacedUAVIds: PropTypes.arrayOf(PropTypes.string),
  misalignedUAVIds: PropTypes.arrayOf(PropTypes.string),
  onApprove: PropTypes.func,
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
      missingUAVIds: getMissingUAVIdsInMapping(state),
      misplacedUAVIds: getMisplacedUAVIds(state),
      misalignedUAVIds: getMisalignedUAVIds(state)
    });
  },

  // mapDispatchToProps
  dispatch => ({
    onApprove() {
      dispatch(approveTakeoffArea());
      setTimeout(() => dispatch(closeTakeoffAreaSetupDialog()), 300);
    },

    onClose() {
      dispatch(closeTakeoffAreaSetupDialog());
    },

    onRevoke() {
      dispatch(revokeTakeoffAreaApproval());
    }
  })
)(TakeoffAreaSetupDialog);
