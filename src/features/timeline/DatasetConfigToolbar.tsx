import History from '@mui/icons-material/History';
import Straighten from '@mui/icons-material/Straighten';
import Terrain from '@mui/icons-material/Terrain';
import Stack, { type StackProps } from '@mui/material/Stack';
import { Tooltip } from '@skybrush/mui-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DatasetToggleButton, {
  type DatasetToggleButtonProps,
} from './DatasetToggleButton';
import { toggleDatasetOnAxis } from './model';
import type { Dataset, TImelineChartAxis, TimelineChartConfig } from './types';

type Props = Omit<StackProps, 'onChange'> & {
  axis: TImelineChartAxis;
  value: TimelineChartConfig;
  onChange: (value: TimelineChartConfig) => void;
};

const DatasetConfigToolbar = ({ axis, value, onChange, ...rest }: Props) => {
  const { t } = useTranslation();
  const datasets = useMemo(
    () => value.datasets.filter((dataset) => dataset.axis === axis),
    [axis, value]
  );

  const buttonProps: Partial<DatasetToggleButtonProps> = {
    datasets,
    onChange: (dataset: Dataset) =>
      onChange(toggleDatasetOnAxis(value, dataset, axis)),
    lightPosition: axis === 'y2' ? 'left' : 'right',
  };

  return (
    <Stack spacing={0.5} {...rest}>
      <Tooltip content={t('timeline.dataset.altitude')}>
        <DatasetToggleButton {...buttonProps} value='altitude'>
          <Terrain />
        </DatasetToggleButton>
      </Tooltip>
      <Tooltip content={t('timeline.dataset.distanceFromHome')}>
        <DatasetToggleButton {...buttonProps} value='distanceFromHome'>
          <Straighten />
        </DatasetToggleButton>
      </Tooltip>
      <Tooltip content={t('timeline.dataset.rthDuration')}>
        <DatasetToggleButton {...buttonProps} value='rthDuration'>
          <History />
        </DatasetToggleButton>
      </Tooltip>
    </Stack>
  );
};

export default DatasetConfigToolbar;
