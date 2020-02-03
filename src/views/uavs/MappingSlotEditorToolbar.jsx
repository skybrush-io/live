import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Close from '@material-ui/icons/Close';
import Mouse from '@material-ui/icons/Mouse';

import { cancelMappingEditorSessionAtCurrentSlot } from '~/features/mission/slice';

const MappingSlotEditorToolbar = React.forwardRef(
  ({ cancelMappingEditorSessionAtCurrentSlot, ...rest }, ref) => {
    return (
      <Toolbar ref={ref} disableGutters variant="dense" {...rest}>
        <IconButton disabled>
          <Mouse />
        </IconButton>
        <Box style={{ userSelect: 'none' }}>
          Enter to save. Tab to move to the next empty slot. Shift reverses
          direction.
        </Box>
        <Box flex={1} />
        <IconButton onClick={cancelMappingEditorSessionAtCurrentSlot}>
          <Close />
        </IconButton>
      </Toolbar>
    );
  }
);

MappingSlotEditorToolbar.propTypes = {
  cancelMappingEditorSessionAtCurrentSlot: PropTypes.func,
  finishMappingEditorSession: PropTypes.func,
  selectedUAVIds: PropTypes.array
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  { cancelMappingEditorSessionAtCurrentSlot },
  null,
  { forwardRef: true }
)(MappingSlotEditorToolbar);
