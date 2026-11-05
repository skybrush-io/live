import Box from '@mui/material/Box';
import clsx from 'clsx';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import { addClockDisplayAutomatically } from '~/features/lcd-clock/actions';
import { removeClockDisplay } from '~/features/lcd-clock/slice';
import type { RootState } from '~/store/reducers';

import LCDClockDisplay from './LCDClockDisplay';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
}));

type Props = {
  addClockDisplay: () => void;
  ids: string[];
  removeClockDisplay: (id: string) => void;
};

/**
 * Panel that shows the status of a clock in the style of a classic
 * 7-segment LCD display.
 */
const LCDClockPanel = ({ addClockDisplay, ids, removeClockDisplay }: Props) => {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.root)}>
      {ids.map((id, index) => (
        <LCDClockDisplay
          key={id}
          id={id}
          flex={1}
          onAdd={index === 0 ? addClockDisplay : null}
          onRemove={index === 0 ? null : () => removeClockDisplay(id)}
        />
      ))}
    </Box>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ids: state.lcdClock.order,
  }),
  // mapDispatchToProps
  { addClockDisplay: addClockDisplayAutomatically, removeClockDisplay }
)(LCDClockPanel);
