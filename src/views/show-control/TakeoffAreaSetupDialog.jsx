import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import FormGroup from '@material-ui/core/FormGroup';

import FormHeader from '~/components/dialogs/FormHeader';
import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import { getEmptyMappingSlotIndices } from '~/features/mission/selectors';
import { closetakeoffAreaSetupDialog } from '~/features/show/slice';
import { getMissingUAVIdsInMapping } from '~/features/uavs/selectors';
import { formatMissionId } from '~/utils/formatting';

/**
 * Presentation component that receives a list of mapping slot indices and
 * formats them nicely, truncating the list as appropriate if it is too long.
 */
const SlotIndexList = ({ indices, title }) =>
  indices && indices.length > 0 ? (
    <Box mt={1}>
      <Box display="flex" flexDirection="row" alignItems="center">
        <Box key="lead">{title}</Box>
        {indices.slice(0, 8).map(index => (
          <Box key={index} ml={1}>
            <DronePlaceholder
              label={
                typeof index === 'number'
                  ? formatMissionId(index)
                  : String(index)
              }
            />
          </Box>
        ))}
        {indices.length > 8 ? (
          <Box key="more" ml={1}>
            + {indices.length - 8} more
          </Box>
        ) : null}
      </Box>
    </Box>
  ) : null;

SlotIndexList.propTypes = {
  indices: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ),
  title: PropTypes.string
};

/**
 * Presentation component that shows how many mapping slots are empty at the
 * moment.
 */
const EmptySlotsIndicator = ({ indices }) => (
  <SlotIndexList indices={indices} title="Empty slots:" />
);

EmptySlotsIndicator.propTypes = {
  indices: PropTypes.arrayOf(PropTypes.number)
};

/**
 * Presentation component that shows which mapping slots have assigned UAVs that
 * are currently missing (i.e. we have received no status report about them).
 */
const MissingUAVsIndicator = ({ uavIds }) => (
  <SlotIndexList indices={uavIds} title="Missing drones:" />
);

MissingUAVsIndicator.propTypes = {
  uavIds: PropTypes.arrayOf(PropTypes.string)
};

/**
 * Presentation component for the dialog that allows the user to validate whether
 * all drones are properly placed in their takeoff positions.
 */
const TakeoffAreaSetupDialog = ({
  emptySlotIndices,
  missingUAVIds,
  open,
  onClose
}) => (
  <Dialog fullWidth open={open} maxWidth="sm" onClose={onClose}>
    <Box mx={3} mt={1} mb={3}>
      <FormGroup>
        <FormHeader>Mapping to takeoff positions</FormHeader>
        {!isEmpty(emptySlotIndices) || !isEmpty(missingUAVIds) ? (
          <>
            <EmptySlotsIndicator indices={emptySlotIndices} />
            <MissingUAVsIndicator uavIds={missingUAVIds} />
          </>
        ) : (
          'Everything OK'
        )}
      </FormGroup>

      <FormGroup>
        <FormHeader>Distances</FormHeader>
      </FormGroup>

      <FormGroup>
        <FormHeader>Headings</FormHeader>
      </FormGroup>
    </Box>
  </Dialog>
);

TakeoffAreaSetupDialog.propTypes = {
  emptySlotIndices: PropTypes.arrayOf(PropTypes.number),
  missingUAVIds: PropTypes.arrayOf(PropTypes.string),
  onClose: PropTypes.func,
  open: PropTypes.bool
};

TakeoffAreaSetupDialog.defaultProps = {
  open: false
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.takeoffAreaSetupDialog,
    emptySlotIndices: getEmptyMappingSlotIndices(state),
    missingUAVIds: getMissingUAVIdsInMapping(state)
  }),

  // mapDispatchToProps
  {
    onClose: closetakeoffAreaSetupDialog
  }
)(TakeoffAreaSetupDialog);
