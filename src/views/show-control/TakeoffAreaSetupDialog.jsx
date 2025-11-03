import SelectAll from '@mui/icons-material/SelectAll';
import VerticalAlignBottom from '@mui/icons-material/VerticalAlignBottom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';
import { Translation, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

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
import { setSelectedUAVIds } from '~/features/uavs/actions';
import {
  getMisalignedUAVIds,
  getMisplacedUAVIds,
  getMissingUAVIdsInMapping,
} from '~/features/uavs/selectors';
import AugmentMappingButton from '~/views/uavs/AugmentMappingButton';
import RecalculateMappingButton from '~/views/uavs/RecalculateMappingButton';

const _cursorPointerStyle = { cursor: 'pointer' };

/**
 * Presentation component that shows how many mapping slots are empty at the
 * moment.
 */
const EmptySlotsIndicator = ({ indices }) => (
  <Translation>
    {(t) => (
      <DronePlaceholderList
        items={indices}
        title={t('takeoffAreaSetupDialog.emptySlots')}
        successMessage={t('takeoffAreaSetupDialog.allSlotsFilled')}
      />
    )}
  </Translation>
);

EmptySlotsIndicator.propTypes = {
  indices: PropTypes.arrayOf(PropTypes.number),
};

/**
 * Presentation component that shows which UAV IDs have been assigned to a mapping
 * slot such that the UAV itself does not seem to exist (i.e. we have received no
 * status report about them).
 */
const MissingDronesIndicator = ({
  hasNonemptyMappingSlot,
  selectDrones,
  uavIds,
}) => (
  <Translation>
    {(t) => (
      <DronePlaceholderList
        items={uavIds}
        title={t('takeoffAreaSetupDialog.missing')}
        successMessage={t('takeoffAreaSetupDialog.allDroneOnline')}
        emptyMessage={t('takeoffAreaSetupDialog.noDrones')}
        preferEmptyMessage={!hasNonemptyMappingSlot}
        actions={
          uavIds &&
          uavIds.length > 0 && (
            <SelectAll
              style={_cursorPointerStyle}
              fontSize='large'
              onClick={() => selectDrones(uavIds)}
            />
          )
        }
      />
    )}
  </Translation>
);

MissingDronesIndicator.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  selectDrones: PropTypes.func.isRequired,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Presentation component that shows which UAVs seem to be placed at the wrong
 * place (far from its takeoff position).
 */
const MisplacedDronesIndicator = ({
  hasNonemptyMappingSlot,
  selectDrones,
  uavIds,
}) => (
  <Translation>
    {(t) => (
      <DronePlaceholderList
        items={uavIds}
        title={t('takeoffAreaSetupDialog.misplaced')}
        successMessage={t('takeoffAreaSetupDialog.allDronesAtTakeoffPositions')}
        emptyMessage={t('takeoffAreaSetupDialog.noDrones')}
        preferEmptyMessage={!hasNonemptyMappingSlot}
        actions={
          uavIds &&
          uavIds.length > 0 && (
            <SelectAll
              style={_cursorPointerStyle}
              fontSize='large'
              onClick={() => selectDrones(uavIds)}
            />
          )
        }
      />
    )}
  </Translation>
);

MisplacedDronesIndicator.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  selectDrones: PropTypes.func.isRequired,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

/**
 * Presentation component that shows which UAVs seem to be facing the wrong
 * direction.
 */
const MisalignedDronesIndicator = ({
  hasNonemptyMappingSlot,
  selectDrones,
  uavIds,
}) => (
  <Translation>
    {(t) => (
      <DronePlaceholderList
        items={uavIds}
        title={t('takeoffAreaSetupDialog.misaligned')}
        successMessage={t(
          'takeoffAreaSetupDialog.allDronesFacingCorrectDirection'
        )}
        emptyMessage={t('takeoffAreaSetupDialog.noDrones')}
        preferEmptyMessage={!hasNonemptyMappingSlot}
        actions={
          uavIds &&
          uavIds.length > 0 && (
            <SelectAll
              style={_cursorPointerStyle}
              fontSize='large'
              onClick={() => selectDrones(uavIds)}
            />
          )
        }
      />
    )}
  </Translation>
);

MisalignedDronesIndicator.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  selectDrones: PropTypes.func.isRequired,
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
  selectDrones,
}) => (
  <>
    <EmptySlotsIndicator indices={emptySlotIndices} />
    <MissingDronesIndicator
      uavIds={missingUAVIds}
      hasNonemptyMappingSlot={hasNonemptyMappingSlot}
      selectDrones={selectDrones}
    />
    <MisplacedDronesIndicator
      uavIds={misplacedUAVIds}
      hasNonemptyMappingSlot={hasNonemptyMappingSlot}
      selectDrones={selectDrones}
    />
    <MisalignedDronesIndicator
      uavIds={misalignedUAVIds}
      hasNonemptyMappingSlot={hasNonemptyMappingSlot}
      selectDrones={selectDrones}
    />
  </>
);

TakeoffAreaSetupDialogIndicatorsPresentation.propTypes = {
  emptySlotIndices: PropTypes.arrayOf(PropTypes.number),
  hasNonemptyMappingSlot: PropTypes.bool,
  misalignedUAVIds: PropTypes.arrayOf(PropTypes.string),
  misplacedUAVIds: PropTypes.arrayOf(PropTypes.string),
  missingUAVIds: PropTypes.arrayOf(PropTypes.string),
  selectDrones: PropTypes.func.isRequired,
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
  (dispatch) => ({
    selectDrones: (ids) => dispatch(setSelectedUAVIds(ids)),
  })
)(TakeoffAreaSetupDialogIndicatorsPresentation);

/**
 * Presentation component for the dialog that allows the user to validate whether
 * all drones are properly placed in their takeoff positions.
 */
const TakeoffAreaSetupDialog = ({
  approved = false,
  hasVirtualDrones,
  open = false,
  onAddVirtualDrones,
  onApprove,
  onClose,
  onRevoke,
  t,
}) => {
  const titleComponents = hasVirtualDrones && (
    <Button
      color='inherit'
      startIcon={<VerticalAlignBottom />}
      onClick={onAddVirtualDrones}
    >
      {t('takeoffAreaSetupDialog.placeVirtualDrones')}
    </Button>
  );
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title={t('takeoffAreaSetupDialog.takeoffAreaSetup')}
      titleComponents={titleComponents}
      onClose={onClose}
    >
      <DialogContent>
        <TakeoffAreaSetupDialogIndicators />
        <Box
          sx={{
            py: 2,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <RecalculateMappingButton />
          <AugmentMappingButton />
        </Box>
        <Box className='bottom-bar' sx={{ textAlign: 'center', pt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={approved}
                value='approved'
                onChange={approved ? onRevoke : onApprove}
              />
            }
            label={t('takeoffAreaSetupDialog.approveTakeoffAreaArrangement')}
          />
        </Box>
      </DialogContent>
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
  t: PropTypes.func,
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
)(withTranslation()(TakeoffAreaSetupDialog));
