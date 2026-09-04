import Stack from '@mui/material/Stack';
import { useState } from 'react';
import DatasetConfigToolbar from './DatasetConfigToolbar';
import MarkerLaneConfigToolbar from './MarkerLaneConfigToolbar';
import TimelineChart from './TimelineChart';
import { EMPTY_CHART } from './model';

const TimelinePanel = () => {
  const [chartConfig, setChartConfig] = useState(EMPTY_CHART);
  return (
    <Stack direction='row' spacing={1} sx={{ flex: 1, height: '100%', p: 1 }}>
      {/* Left axis contents */}
      <DatasetConfigToolbar
        axis='y'
        value={chartConfig}
        onChange={setChartConfig}
      />

      {/* Chart area */}
      <Stack spacing={1} sx={{ flex: 1 }}>
        <TimelineChart {...chartConfig} />
        <MarkerLaneConfigToolbar
          value={chartConfig}
          onChange={setChartConfig}
        />
      </Stack>

      {/* Right axis contents */}
      <DatasetConfigToolbar
        axis='y2'
        value={chartConfig}
        onChange={setChartConfig}
      />
    </Stack>
  );
};

export default TimelinePanel;
