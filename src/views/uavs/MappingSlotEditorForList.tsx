import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Color from 'color';
import type { FocusEventHandler, KeyboardEventHandler } from 'react';
import { connect } from 'react-redux';

import { makeStyles, monospacedFont } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import { commitMappingEditorSessionAtCurrentSlot } from '~/features/mission/actions';
import { getUAVIdForMappingSlotBeingEdited } from '~/features/mission/selectors';
import { cancelMappingEditorSessionAtCurrentSlot } from '~/features/mission/slice';
import type { MissionMappingEditorContinuation } from '~/features/mission/utils';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import type { RootState } from '~/store/reducers';

const INPUT_WIDTH = 40;
const WIDTH = INPUT_WIDTH * 2 + 4;

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',

    boxSizing: 'border-box',
    width: WIDTH,
    left: 5,
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

    padding: 0,
    position: 'absolute',
    top: '50%',
    left: -3,
    width: INPUT_WIDTH,
    transform: 'translateY(-50%)',

    '& input': {
      textAlign: 'right',
    },

    '& input::selection': {
      backgroundColor: new Color(Colors.info).darken(0.2).string(),
    },
  },
}));

type Props = {
  cancelMappingEditorSessionAtCurrentSlot: () => void;
  defaultValue?: string | null;
  commitMappingEditorSessionAtCurrentSlot: (payload: {
    value: string;
    continuation: MissionMappingEditorContinuation;
  }) => void;
  optimizeUIForTouch: boolean;
};

/**
 * Simple text field overlaid on top of a drone avatar or drone placeholder
 * when we are editing the mapping slot at a given index.
 */
const MappingSlotEditorForList = ({
  cancelMappingEditorSessionAtCurrentSlot,
  defaultValue,
  commitMappingEditorSessionAtCurrentSlot,
  optimizeUIForTouch,
}: Props) => {
  const classes = useStyles();

  const onBlur: FocusEventHandler = (event) => {
    const value = (event.target as HTMLInputElement)?.value;
    if (value) {
      commitMappingEditorSessionAtCurrentSlot({
        continuation: 'stay',
        value,
      });
    }
  };

  const onFocus: FocusEventHandler = (event) =>
    (event.target as HTMLInputElement)?.select();

  const onKeyDown: KeyboardEventHandler = (event) => {
    const value = (event.target as HTMLInputElement)?.value;

    if (event.key === 'Enter') {
      commitMappingEditorSessionAtCurrentSlot({
        continuation: event.shiftKey ? 'prev' : 'next',
        value,
      });

      event.preventDefault();
      return false;
    }

    if (event.key === 'Tab') {
      commitMappingEditorSessionAtCurrentSlot({
        continuation: event.shiftKey ? 'prevEmpty' : 'nextEmpty',
        value,
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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    defaultValue: getUAVIdForMappingSlotBeingEdited(state),
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  }),
  // mapDispatchToProps
  {
    cancelMappingEditorSessionAtCurrentSlot,
    commitMappingEditorSessionAtCurrentSlot,
  }
)(MappingSlotEditorForList);
