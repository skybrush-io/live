import Color from 'color';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import InputBase from '@material-ui/core/InputBase';
import { makeStyles } from '@material-ui/core/styles';

import { monospacedFont } from '@skybrush/app-theme-material-ui';

import Colors from '~/components/colors';
import { getUAVIdForMappingSlotBeingEdited } from '~/features/mission/selectors';
import {
  cancelMappingEditorSessionAtCurrentSlot,
  commitMappingEditorSessionAtCurrentSlot,
} from '~/features/mission/slice';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';

const WIDTH = 64;

const useStyles = makeStyles(
  (theme) => ({
    root: {
      position: 'absolute',

      boxSizing: 'border-box',
      width: WIDTH,
      left: theme.spacing(1),
      top: -5,
      bottom: -6,
      zIndex: 1000,

      backgroundColor: 'rgba(0, 0, 0, 0.16)',
      border: '1px solid rgba(0, 0, 0, 0.5)',
      borderRadius: theme.spacing(0.5),
      boxShadow: `0 0 4px 2px rgba(0, 0, 0, 0.3)`,

      padding: theme.spacing(0, 0.5),
    },

    input: {
      fontFamily: monospacedFont,
      fontSize: 'small',

      padding: theme.spacing(0, 0.5),
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      transform: 'translateY(-50%)',

      '& input': {
        textAlign: 'right',
      },

      '& input::selection': {
        backgroundColor: new Color(Colors.info).darken(0.2).string(),
      },
    },
  }),
  { name: 'MappingSlotEditorForList' }
);

/**
 * Simple text field overlaid on top of a drone avatar or drone placeholder
 * when we are editing the mapping slot at a given index.
 */
const MappingSlotEditorForList = ({
  cancelMappingEditorSessionAtCurrentSlot,
  defaultValue,
  commitMappingEditorSessionAtCurrentSlot,
  optimizeUIForTouch,
}) => {
  const classes = useStyles();

  const onBlur = (event) => {
    commitMappingEditorSessionAtCurrentSlot({
      value: event.target.value,
    });
  };

  const onFocus = (event) => event.target.select();

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      commitMappingEditorSessionAtCurrentSlot({
        continuation: event.shiftKey ? 'prev' : 'next',
        value: event.target.value,
      });

      event.preventDefault();
      return false;
    }

    if (event.key === 'Tab') {
      commitMappingEditorSessionAtCurrentSlot({
        continuation: event.shiftKey ? 'prevEmpty' : 'nextEmpty',
        value: event.target.value,
      });

      event.preventDefault();
      return false;
    }

    if (event.key === 'Escape') {
      cancelMappingEditorSessionAtCurrentSlot();
    }
  };

  return (
    <Box className={classes.root}>
      <InputBase
        fullWidth
        autoFocus={!optimizeUIForTouch}
        className={classes.input}
        defaultValue={defaultValue}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />
    </Box>
  );
};

MappingSlotEditorForList.propTypes = {
  cancelMappingEditorSessionAtCurrentSlot: PropTypes.func,
  defaultValue: PropTypes.string,
  commitMappingEditorSessionAtCurrentSlot: PropTypes.func,
  optimizeUIForTouch: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    defaultValue: getUAVIdForMappingSlotBeingEdited(state),
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  }),
  // mapDispatchToProps
  {
    cancelMappingEditorSessionAtCurrentSlot,
    commitMappingEditorSessionAtCurrentSlot,
  }
)(MappingSlotEditorForList);
