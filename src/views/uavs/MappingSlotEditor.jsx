import Color from 'color';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import InputBase from '@material-ui/core/InputBase';
import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';
import { getUAVIdForMappingSlotBeingEdited } from '~/features/mission/selectors';
import {
  cancelMappingEditorSessionAtCurrentSlot,
  commitMappingEditorSessionAtCurrentSlot
} from '~/features/mission/slice';

const useStyles = makeStyles(
  theme => ({
    root: {
      position: 'absolute',
      width: 48,
      height: 48,
      top: theme.spacing(0.5),
      zIndex: 1000
    },

    input: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '1.25rem',

      '& input::selection': {
        backgroundColor: new Color(Colors.info).darken(0.2).string()
      }
    }
  }),
  { name: 'MappingSlotEditor' }
);

const inputProps = {
  style: {
    textAlign: 'center'
  }
};

/**
 * Simple text field overlaid on top of a drone avatar or drone placeholder
 * when we are editing the mapping slot at a given index.
 */
const MappingSlotEditor = ({
  cancelMappingEditorSessionAtCurrentSlot,
  defaultValue,
  commitMappingEditorSessionAtCurrentSlot
}) => {
  const classes = useStyles();

  const onBlur = () => {
    // cancelMappingEditorSessionAtCurrentSlot();
  };

  const onFocus = event => event.target.select();

  const onKeyDown = event => {
    if (event.key === 'Enter') {
      commitMappingEditorSessionAtCurrentSlot({
        continue: !event.shiftKey,
        value: event.target.value
      });
    } else if (event.keyCode === 27) {
      cancelMappingEditorSessionAtCurrentSlot();
    }
  };

  return (
    <Box className={classes.root}>
      <InputBase
        autoFocus
        fullWidth
        className={classes.input}
        defaultValue={defaultValue}
        inputProps={inputProps}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />
    </Box>
  );
};

MappingSlotEditor.propTypes = {
  cancelMappingEditorSessionAtCurrentSlot: PropTypes.func,
  defaultValue: PropTypes.string,
  commitMappingEditorSessionAtCurrentSlot: PropTypes.func
};

export default connect(
  // mapStateToProps
  state => ({
    defaultValue: getUAVIdForMappingSlotBeingEdited(state)
  }),
  // mapDispatchToProps
  {
    cancelMappingEditorSessionAtCurrentSlot,
    commitMappingEditorSessionAtCurrentSlot
  }
)(MappingSlotEditor);
