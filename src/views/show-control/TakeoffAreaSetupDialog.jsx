import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import VerticalAlignBottom from '@material-ui/icons/VerticalAlignBottom';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import DronePlaceholderList from '~/components/uavs/DronePlaceholderList';
import { addVirtualDronesForMission } from '~/features/mission/actions';
import {
  getEmptyMappingSlotIndices,
  hasNonemptyMappingSlot,
} from '~/features/mission/selectors';
import { supportsVirtualDrones } from '~/features/servers/selectors';
import { approveTakeoffArea } from '~/features/show/actions';
import { isTakeoffAreaApproved } from '~/features/show/selectors';
import {
  closeTakeoffAreaSetupDialog,
  revokeTakeoffAreaApproval,
} from '~/features/show/slice';
import {
  getMisalignedUAVIds,
  getMisplacedUAVIds,
  getMissingUAVIdsInMapping,
} from '~/features/uavs/selectors';
import AugmentMappingButton from '~/views/uavs/AugmentMappingButton';
import RecalculateMappingButton from '~/views/uavs/RecalculateMappingButton';

/**
 * Presentation component that shows how many mapping slots are empty at the
 * moment.
 */
const EmptySlotsIndicator = ({ indices }) => (
  <DronePlaceholderList
    items={indices}
    title='Empty slots:'
    successMessage='All slots in the mission are filled.'
  />
);

EmptySlotsIndicator.propTypes = {
  indices: PropTypes.arrayOf(PropTypes.number),
};

/**
 * Presentation component that shows which UAV IDs have been assigned to a mapping
 * slot such that the UAV itself does not seem to exist (i.e. we have received no
 * status report about them).
 */
const MissingDronesIndicator = ({ hasNonemptyMappingSlot, uavIds }) => (
  <DronePlaceholderList
    items={uavIds}
    title='Missing:'
    successMessage='All drones in the mission are online.'
    emptyMessage='There are no drones in the mission.'
    preferEmptyMessage={!hasNonemptyMappingSlot}
  />
);

MissingDronesIndicator.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Presentation component that shows which UAVs seem to be placed at the wrong
 * place (far from its takeoff position).
 */
const MisplacedDronesIndicator = ({ hasNonemptyMappingSlot, uavIds }) => (
  <DronePlaceholderList
    items={uavIds}
    title='Misplaced:'
    successMessage='All drones are placed at their takeoff positions.'
    emptyMessage='There are no drones in the mission.'
    preferEmptyMessage={!hasNonemptyMappingSlot}
  />
);

MisplacedDronesIndicator.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Presentation component that shows which UAVs seem to be facing the wrong
 * direction.
 */
const MisalignedDronesIndicator = ({ hasNonemptyMappingSlot, uavIds }) => (
  <DronePlaceholderList
    items={uavIds}
    title='Misaligned:'
    successMessage='All drones are facing the correct direction.'
    emptyMessage='There are no drones in the mission.'
    preferEmptyMessage={!hasNonemptyMappingSlot}
  />
);

MisalignedDronesIndicator.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Component that shows all the indicators in the takeoff area setup dialog.
 */
const TakeoffAreaSetupDialogIndicatorsPresentation = ({
  emptySlotIndices,
  hasNonemptyMappingSlot,
  misalignedUAVIds,
  misplacedUAVIds,
  missingUAVIds,
}) => (
  <>
    <EmptySlotsIndicator indices={emptySlotIndices} />
    <MissingDronesIndicator
      uavIds={missingUAVIds}
      hasNonemptyMappingSlot={hasNonemptyMappingSlot}
    />
    <MisplacedDronesIndicator
      uavIds={misplacedUAVIds}
      hasNonemptyMappingSlot={hasNonemptyMappingSlot}
    />
    <MisalignedDronesIndicator
      uavIds={misalignedUAVIds}
      hasNonemptyMappingSlot={hasNonemptyMappingSlot}
    />
  </>
);

TakeoffAreaSetupDialogIndicatorsPresentation.propTypes = {
  emptySlotIndices: PropTypes.arrayOf(PropTypes.number),
  hasNonemptyMappingSlot: PropTypes.bool,
  misalignedUAVIds: PropTypes.arrayOf(PropTypes.string),
  misplacedUAVIds: PropTypes.arrayOf(PropTypes.string),
  missingUAVIds: PropTypes.arrayOf(PropTypes.string),
};

const TakeoffAreaSetupDialogIndicators = connect(
  // mapStateToProps
  (state) => ({
    emptySlotIndices: getEmptyMappingSlotIndices(state),
    hasNonemptyMappingSlot: hasNonemptyMappingSlot(state),
    missingUAVIds: getMissingUAVIdsInMapping(state),
    misplacedUAVIds: getMisplacedUAVIds(state),
    misalignedUAVIds: getMisalignedUAVIds(state),
  }),
  // mapDispatchToProps
  {}
)(TakeoffAreaSetupDialogIndicatorsPresentation);

/**
 * Presentation component for the dialog that allows the user to validate whether
 * all drones are properly placed in their takeoff positions.
 */
const TakeoffAreaSetupDialog = ({
  approved,
  hasVirtualDrones,
  open,
  onAddVirtualDrones,
  onApprove,
  onClose,
  onRevoke,
}) => {
  const titleComponents = hasVirtualDrones && (
    <Button
      color='inherit'
      startIcon={<VerticalAlignBottom />}
      onClick={onAddVirtualDrones}
    >
      Place virtual drones
    </Button>
  );
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title='Takeoff area setup'
      titleComponents={titleComponents}
      onClose={onClose}
    >
      <DialogContent>
        <TakeoffAreaSetupDialogIndicators />
        <Box py={2} display='flex' flexDirection='row' justifyContent='center'>
          <RecalculateMappingButton />
          <AugmentMappingButton />
        </Box>
        <Box className='bottom-bar' textAlign='center' pt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={approved}
                value='approved'
                onChange={approved ? onRevoke : onApprove}
              />
            }
            label='Approve takeoff area arrangement'
          />
        </Box>
      </DialogContent>
      <DialogActions />
    </DraggableDialog>
  );
};

TakeoffAreaSetupDialog.propTypes = {
  approved: PropTypes.bool,
  hasVirtualDrones: PropTypes.bool,
  onAddVirtualDrones: PropTypes.func,
  onApprove: PropTypes.func,
  onClose: PropTypes.func,
  onRevoke: PropTypes.func,
  open: PropTypes.bool,
};

TakeoffAreaSetupDialog.defaultProps = {
  approved: false,
  open: false,
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.takeoffAreaSetupDialog,
    approved: isTakeoffAreaApproved(state),
    hasVirtualDrones: supportsVirtualDrones(state),
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onAddVirtualDrones() {
      dispatch(addVirtualDronesForMission());
    },

    onApprove() {
      dispatch(approveTakeoffArea());
      setTimeout(() => dispatch(closeTakeoffAreaSetupDialog()), 300);
    },

    onClose() {
      dispatch(closeTakeoffAreaSetupDialog());
    },

    onRevoke() {
      dispatch(revokeTakeoffAreaApproval());
    },
  })
)(TakeoffAreaSetupDialog);
