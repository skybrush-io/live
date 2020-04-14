import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import Close from '@material-ui/icons/Close';
import Keyboard from '@material-ui/icons/Keyboard';

import { cancelMappingEditorSessionAtCurrentSlot } from '~/features/mission/slice';

const useStyles = makeStyles(
  (theme) => ({
    box: {
      userSelect: 'none',
      whiteSpace: 'nowrap',
    },
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 1),
    },
  }),
  { name: 'MappingSlotEditorToolbar' }
);

const MappingSlotEditorToolbar = React.forwardRef(
  ({ cancelMappingEditorSessionAtCurrentSlot, ...rest }, ref) => {
    const classes = useStyles();
    return (
      <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
        <IconButton disabled>
          <Keyboard />
        </IconButton>
        <Box className={classes.box}>
          <kbd>Enter</kbd> Save
        </Box>
        <Divider orientation='vertical' className={classes.divider} />
        <Box className={classes.box}>
          <kbd>Tab</kbd> Select next empty slot
        </Box>
        <Divider orientation='vertical' className={classes.divider} />
        <Box className={classes.box}>
          Hold <kbd>Shift</kbd> to reverse direction.
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
  selectedUAVIds: PropTypes.array,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  { cancelMappingEditorSessionAtCurrentSlot },
  null,
  { forwardRef: true }
)(MappingSlotEditorToolbar);
