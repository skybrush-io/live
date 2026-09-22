import SelectAll from '@mui/icons-material/SelectAll';
import VerticalAlignBottom from '@mui/icons-material/VerticalAlignBottom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import { Translation, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  DraggableDialog,
  SmallProgressIndicator,
} from '@skybrush/mui-components';

import DronePlaceholderList from '~/components/uavs/DronePlaceholderList';
import { addVirtualDronesForMission } from '~/features/mission/actions';
import {
  getEmptyMappingSlotIndices,
  hasNonemptyMappingSlot,
  isMappingBeingCalculated,
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
import type { AppDispatch, RootState } from '~/store/reducers';
import AugmentMappingButton from '~/views/uavs/AugmentMappingButton';
import RecalculateMappingButton from '~/views/uavs/RecalculateMappingButton';

const _cursorPointerStyle = { cursor: 'pointer' };

type SlotIndicatorProps = {
  indices: number[];
};

/**
 * Presentation component that shows how many mapping slots are empty at the
 * moment.
 */
const EmptySlotsIndicator = ({ indices }: SlotIndicatorProps) => (
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

type DroneIndicatorProps = {
  hasNonemptyMappingSlot: boolean;
  selectDrones: (ids: string[]) => void;
  uavIds: string[];
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
}: DroneIndicatorProps) => (
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

/**
 * Presentation component that shows which UAVs seem to be placed at the wrong
 * place (far from its takeoff position).
 */
const MisplacedDronesIndicator = ({
  hasNonemptyMappingSlot,
  selectDrones,
  uavIds,
}: DroneIndicatorProps) => (
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

/**
 * Presentation component that shows which UAVs seem to be facing the wrong
 * direction.
 */
const MisalignedDronesIndicator = ({
  hasNonemptyMappingSlot,
  selectDrones,
  uavIds,
}: DroneIndicatorProps) => (
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

type TakeoffAreaSetupDialogIndicatorsPresentationProps = {
  emptySlotIndices: number[];
  hasNonemptyMappingSlot: boolean;
  misalignedUAVIds: string[];
  misplacedUAVIds: string[];
  missingUAVIds: string[];
  selectDrones: (ids: string[]) => void;
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
}: TakeoffAreaSetupDialogIndicatorsPresentationProps) => (
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

const TakeoffAreaSetupDialogIndicators = connect(
  // mapStateToProps
  (state: RootState) => ({
    emptySlotIndices: getEmptyMappingSlotIndices(state),
    hasNonemptyMappingSlot: hasNonemptyMappingSlot(state),
    missingUAVIds: getMissingUAVIdsInMapping(state),
    misplacedUAVIds: getMisplacedUAVIds(state),
    misalignedUAVIds: getMisalignedUAVIds(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    selectDrones: (ids: string[]) => dispatch(setSelectedUAVIds(ids)),
  })
)(TakeoffAreaSetupDialogIndicatorsPresentation);

type TakeoffAreaSetupDialogProps = {
  approved?: boolean;
  calculating?: boolean;
  hasVirtualDrones?: boolean;
  open?: boolean;
  onAddVirtualDrones?: () => void;
  onApprove?: () => void;
  onClose?: () => void;
  onRevoke?: () => void;
};

/**
 * Presentation component for the dialog that allows the user to validate whether
 * all drones are properly placed in their takeoff positions.
 */
const TakeoffAreaSetupDialog = ({
  approved = false,
  calculating,
  hasVirtualDrones,
  open = false,
  onAddVirtualDrones,
  onApprove,
  onClose,
  onRevoke,
}: TakeoffAreaSetupDialogProps) => {
  const { t } = useTranslation();
  const titleComponents = (
    <Box>
      <SmallProgressIndicator
        label={t('mappingEditorToolbar.calculatingMapping')}
        visible={calculating}
        sx={{ textAlign: 'right' }}
      />
    </Box>
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
        {hasVirtualDrones && (
          <Box
            sx={{
              pb: 2,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Button
              color='inherit'
              startIcon={<VerticalAlignBottom />}
              onClick={onAddVirtualDrones}
            >
              {t('takeoffAreaSetupDialog.placeVirtualDrones')}
            </Button>
          </Box>
        )}
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
  calculating: PropTypes.bool,
  hasVirtualDrones: PropTypes.bool,
  onAddVirtualDrones: PropTypes.func,
  onApprove: PropTypes.func,
  onClose: PropTypes.func,
  onRevoke: PropTypes.func,
  open: PropTypes.bool,
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...state.show.takeoffAreaSetupDialog,
    approved: isTakeoffAreaApproved(state),
    calculating: isMappingBeingCalculated(state),
    hasVirtualDrones: supportsVirtualDrones(state),
  }),

  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onAddVirtualDrones() {
      void dispatch(addVirtualDronesForMission());
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
