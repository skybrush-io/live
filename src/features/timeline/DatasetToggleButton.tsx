import ToggleButton, {
  type ToggleButtonProps,
} from '@mui/material/ToggleButton';
import { Colors } from '@skybrush/app-theme-mui';
import ColoredLight from '~/components/ColoredLight';
import { resolveColorIndex } from '~/components/charts/palette';
import type { Dataset, DatasetConfig } from './types';

export type DatasetToggleButtonProps = Omit<
  ToggleButtonProps,
  'onChange' | 'selected'
> & {
  datasets?: DatasetConfig[];
  lightPosition?: 'left' | 'right';
  value: Dataset;
  onChange?: (value: Dataset) => void;
};

export const DatasetToggleButton = ({
  datasets,
  lightPosition = 'left',
  value,
  onChange,
  children,
  ...rest
}: DatasetToggleButtonProps) => {
  const config = (datasets ?? []).find((d) => d.type === value);
  const light = (
    <ColoredLight
      color={resolveColorIndex(config?.colorIndex)?.color ?? Colors.off}
      sx={{
        mr: lightPosition === 'left' ? 1 : 0,
        ml: lightPosition === 'right' ? 1 : 0,
      }}
    />
  );

  return (
    <ToggleButton
      size='small'
      {...rest}
      value={value}
      selected={Boolean(config)}
      onChange={() => {
        onChange?.(value);
      }}
    >
      {lightPosition === 'left' && light}
      {children}
      {lightPosition === 'right' && light}
    </ToggleButton>
  );
};

export default DatasetToggleButton;
