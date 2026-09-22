import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Color from 'color';
import type { FocusEventHandler, KeyboardEventHandler } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import { commitMappingEditorSessionAtCurrentSlot } from '~/features/mission/actions';
import { getUAVIdForMappingSlotBeingEdited } from '~/features/mission/selectors';
import { cancelMappingEditorSessionAtCurrentSlot } from '~/features/mission/slice';
import type { MissionMappingEditorContinuation } from '~/features/mission/utils';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import type { RootState } from '~/store/reducers';
import type { Nullable } from '~/utils/types';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    width: 48,
    height: 48,
    top: theme.spacing(0.5),
    zIndex: 1000,
  },

  input: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.25rem',

    '& input': {
      textAlign: 'center',
    },

    '& input::selection': {
      backgroundColor: new Color(Colors.info).darken(0.2).string(),
    },
  },
}));

type Props = {
  cancelMappingEditorSessionAtCurrentSlot: () => void;
  defaultValue?: Nullable<string>;
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
const MappingSlotEditorForGrid = ({
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
)(MappingSlotEditorForGrid);
