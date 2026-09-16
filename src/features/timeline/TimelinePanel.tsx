import Stack from '@mui/material/Stack';
import { connect } from 'react-redux';

import type { RootState } from '~/store/reducers';

import DatasetConfigToolbar from './DatasetConfigToolbar';
import MarkerLaneConfigToolbar from './MarkerLaneConfigToolbar';
import TimelineChart from './TimelineChart';
import { getTimelineChartConfig } from './selectors';
import { setChartConfig } from './slice';
import type { TimelineChartConfig } from './types';

type Props = {
  chartConfig: TimelineChartConfig;
  onChartConfigChange: (value: TimelineChartConfig) => void;
};

const TimelinePanel = ({ chartConfig, onChartConfigChange }: Props) => {
  return (
    <Stack direction='row' spacing={1} sx={{ flex: 1, height: '100%', p: 1 }}>
      {/* Left axis contents */}
      <DatasetConfigToolbar
        axis='y'
        value={chartConfig}
        onChange={onChartConfigChange}
      />

      {/* Chart area */}
      <Stack spacing={1} sx={{ flex: 1 }}>
        <TimelineChart {...chartConfig} />
        <MarkerLaneConfigToolbar
          value={chartConfig}
          onChange={onChartConfigChange}
        />
      </Stack>

      {/* Right axis contents */}
      <DatasetConfigToolbar
        axis='y2'
        value={chartConfig}
        onChange={onChartConfigChange}
      />
    </Stack>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    chartConfig: getTimelineChartConfig(state),
  }),
  // mapDispatchToProps
  {
    onChartConfigChange: setChartConfig,
  }
)(TimelinePanel);
