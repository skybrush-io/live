import PropTypes from 'prop-types';
import React from 'react';

import LCDText from './LCDText';

/**
 * Component at the top of the LCD panel that allows the user to select
 * a clock tp show in the LCD panel slot.
 */
const ClockSelector = ({ clocks, lcdStyle, onClick, selectedClockId }) =>
  clocks.map((clock) => (
    <LCDText
      key={clock.id}
      {...lcdStyle}
      p={0.5}
      off={clock.id !== selectedClockId}
      onClick={
        clock.id !== selectedClockId && onClick
          ? () => onClick(clock.id)
          : undefined
      }
    >
      {clock.label}
    </LCDText>
  ));

ClockSelector.propTypes = {
  clocks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  lcdStyle: PropTypes.object,
  onClock: PropTypes.func,
  selectedClockId: PropTypes.string,
};

export default ClockSelector;
