import LCDText, { type LCDTextProps } from './LCDText';

import type { ClockIdWithLabel } from '~/features/lcd-clock/selectors';

type Props = {
  clocks: ClockIdWithLabel[];
  lcdStyle?: Pick<LCDTextProps, 'color' | 'decoration' | 'offSegments'>;
  onClick?: (clockId: string) => void;
  selectedClockId?: string;
};

/**
 * Component at the top of the LCD panel that allows the user to select
 * a clock tp show in the LCD panel slot.
 */
const ClockSelector = ({ clocks, lcdStyle, onClick, selectedClockId }: Props) =>
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

export default ClockSelector;
