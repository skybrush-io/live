/**
 * @file Generic single-line input dialog to act as a replacement
 * for `window.prompt()`.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { CoordinateField, DistanceField, Select } from '~/components/forms';
import DronePlaceholderList from '~/components/uavs/DronePlaceholderList';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import { submitFlyToTargetDialog } from '~/features/uav-control/actions';
import { closeFlyToTargetDialog } from '~/features/uav-control/slice';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';

/**
 * Prop type that describes how the initial values should look like in the form.
 */
const initialValuePropType = PropTypes.shape({
  coords: PropTypes.string,
  mode: PropTypes.oneOf([
    'relative',
    'amsl',
    'ahl',
    // 'agl' // Not yet supported on the drones
  ]),
  altitude: PropTypes.number,
});

const FlyToTargetForm = ({
  coordinateFormatter,
  initialValues,
  onCancel,
  onSubmit,
  optimizeUIForTouch,
  uavIds,
}) => (
  <Form initialValues={initialValues} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <Box>
        <DialogContent>
          <DronePlaceholderList
            title='Selection:'
            items={uavIds}
            mt={0}
            mb={1}
          />
          <CoordinateField
            autoFocus={!optimizeUIForTouch}
            name='coords'
            label='Target coordinate'
            formatter={coordinateFormatter}
          />
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ flex: 1 }}>
              <DistanceField name='altitude' label='Altitude' margin='normal' />
            </Box>
            <Box sx={{ flex: 2 }}>
              <Select name='mode' label='Alt mode' margin='normal'>
                <MenuItem value='relative'>above current altitude</MenuItem>
                <MenuItem value='amsl'>above mean sea level</MenuItem>
                <MenuItem value='ahl'>above home level</MenuItem>
                {/* 'agl' is not yet supported on the drones */}
                {/* <MenuItem value='agl'>above ground level</MenuItem> */}
              </Select>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color='primary' onClick={handleSubmit}>
            Confirm
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </DialogActions>
      </Box>
    )}
  </Form>
);

FlyToTargetForm.propTypes = {
  coordinateFormatter: PropTypes.func,
  initialValues: initialValuePropType,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  optimizeUIForTouch: PropTypes.bool,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

const FlyToTargetDialog = ({ onClose, open, ...rest }) => {
  return (
    <DraggableDialog
      open={open}
      maxWidth='xs'
      title='Fly to target'
      onClose={onClose}
    >
      <FlyToTargetForm onCancel={onClose} {...rest} />
    </DraggableDialog>
  );
};

FlyToTargetDialog.propTypes = {
  coordinateFormatter: PropTypes.func,
  initialValues: initialValuePropType,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool,
  optimizeUIForTouch: PropTypes.bool,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.uavControl.flyToTargetDialog,
    coordinateFormatter: getPreferredCoordinateFormatter(state),
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
    uavIds: getSelectedUAVIds(state),
  }),
  // mapDispatchToProps
  {
    onClose: closeFlyToTargetDialog,
    onSubmit: submitFlyToTargetDialog,
  }
)(FlyToTargetDialog);
