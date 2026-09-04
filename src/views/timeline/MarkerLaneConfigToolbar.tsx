import Stack, { type StackProps } from '@mui/material/Stack';
import MarkerLaneToggleButton from './MarkerLaneToggleButton';
import { toggleMarkerLane } from './model';
import type { MarkerLane, TimelineChartConfig } from './types';

type Props = Omit<StackProps, 'onChange' | 'value'> & {
  value: TimelineChartConfig;
  onChange: (value: TimelineChartConfig) => void;
};

export const MarkerLaneConfigToolbar = ({
  value,
  onChange,
  ...rest
}: Props) => {
  const { markerLanes } = value;

  const toggleLane = (lane: MarkerLane) => {
    onChange(toggleMarkerLane(value, lane));
  };

  return (
    <Stack direction='row' spacing={1} {...rest}>
      <MarkerLaneToggleButton
        value='cue'
        markers={markerLanes}
        onChange={toggleLane}
      />
      <MarkerLaneToggleButton
        value='segment'
        markers={markerLanes}
        onChange={toggleLane}
      />
      <MarkerLaneToggleButton
        value='rthPlan'
        markers={markerLanes}
        onChange={toggleLane}
      />
    </Stack>
  );
};

export default MarkerLaneConfigToolbar;
