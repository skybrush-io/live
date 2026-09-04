import ToggleButton, {
  type ToggleButtonProps,
} from '@mui/material/ToggleButton';
import { Colors } from '@skybrush/app-theme-mui';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const config = markers.find((m) => m.type === value);

  return (
    <ToggleButton
      value={value}
      size='small'
      {...rest}
      selected={Boolean(config)}
      onClick={() => onChange(value)}
    >
      <ColoredLight
        color={resolveColorIndex(config?.colorIndex)?.color ?? Colors.off}
        sx={{ mr: 1 }}
      />
      {describeMarkerLane(value)(t)}
    </ToggleButton>
  );
};

export default MarkerLaneToggleButton;
