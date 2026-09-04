import ToggleButton, {
  type ToggleButtonProps,
} from '@mui/material/ToggleButton';
import { Colors } from '@skybrush/app-theme-mui';
import { resolveColorIndex } from '~/components/charts/palette';
import ColoredLight from '~/components/ColoredLight';
import { describeMarkerLane } from './model';
import type { MarkerLane, MarkerLaneConfig } from './types';

type Props = Omit<ToggleButtonProps, 'value' | 'onChange'> & {
  markers: MarkerLaneConfig[];
  value: MarkerLane;
  onChange: (value: MarkerLane) => void;
};

export const MarkerLaneToggleButton = ({
  markers,
  value,
  onChange,
  ...rest
}: Props) => {
  const config = markers.find((m) => m.type === value);

  // TODO(ntamas): localize!

  return (
    <ToggleButton
      value='cues'
      size='small'
      {...rest}
      selected={Boolean(config)}
      onClick={() => onChange(value)}
    >
      <ColoredLight
        color={resolveColorIndex(config?.colorIndex)?.color ?? Colors.off}
        sx={{ mr: 1 }}
      />
      {describeMarkerLane(value)}
    </ToggleButton>
  );
};

export default MarkerLaneToggleButton;
