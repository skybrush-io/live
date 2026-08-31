import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { createSelector } from '@reduxjs/toolkit';
import type { Chart, ChartData, ChartOptions } from 'chart.js';
import isNil from 'lodash-es/isNil';
import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import { isThemeDark } from '@skybrush/app-theme-mui';

import {
  createChartOptions,
  createGradientBackground,
  mergeChartOptions,
  NO_BAR_CHART_DATA,
} from '~/components/charts/utils';
import Colors from '~/components/colors';
import type { RootState } from '~/store/reducers';

import BarChart from './BarChart';
import { getDisplayedSatelliteCNRValues } from './selectors';
import type { SatelliteCNRInfo } from './types';

/* ************************************************************************ */

const cnrBoundaries = [30, 40];

const colors = ['#424242', Colors.error, Colors.warning, Colors.success];

const createGradientFills = createSelector(
  (ctx: CanvasRenderingContext2D) => ctx,
  (ctx) => colors.map((color) => createGradientBackground({ ctx, color }))
);

const styleForCNR = (cnr: number | null | undefined) => {
  if (isNil(cnr) || cnr <= 0) {
    return 0;
  }

  if (cnr < cnrBoundaries[0]) {
    return 1;
  }

  if (cnr < cnrBoundaries[1]) {
    return 2;
  }

  return 3;
};

/* ************************************************************************ */

type ProcessedCNRItem = {
  label: string;
  value: number | null;
  backgroundColor: CanvasGradient;
  borderColor: string;
};

const createDataFromItemsAndDrawingContext = (
  items: SatelliteCNRInfo[],
  ctx: CanvasRenderingContext2D
): ChartData<'bar'> => {
  const gradients = createGradientFills(ctx);
  const now = Date.now();
  const processedItems = items
    .map((item): ProcessedCNRItem | null => {
      const ageMsec = now - (item.lastUpdatedAt ?? 0);

      if (ageMsec >= 60000) {
        return null;
      }

      const style = ageMsec >= 5000 ? 0 : styleForCNR(item.cnr);
      return {
        label: item.id,
        value: item.cnr,
        backgroundColor: gradients[style],
        borderColor: colors[style],
      };
    })
    .filter(Boolean) as ProcessedCNRItem[]; // cast valid because nulls are excluded

  return {
    labels: processedItems.map((item) => item.label),
    datasets: [
      {
        backgroundColor: processedItems.map((item) => item.backgroundColor),
        borderColor: processedItems.map((item) => item.borderColor),
        borderWidth: 2,
        label: 'CNR',
        data: processedItems.map((item) => item.value),
      },
    ],
  };
};

const CHART_OPTIONS: ChartOptions<'bar'> = {
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.formattedValue} dB-Hz`,
      },
    },
  },

  scales: {
    y: {
      suggestedMin: 0,
      suggestedMax: 60,
      ticks: {
        maxTicksLimit: 7,
      },
    },
  },
};

const createOptions = (isDark: boolean) =>
  mergeChartOptions<'bar'>(createChartOptions(isDark), CHART_OPTIONS);

const options = {
  dark: createOptions(true),
  light: createOptions(false),
};

type Props = {
  height?: number;
  items: SatelliteCNRInfo[];
};

const RTKSatelliteObservations = ({ height = 160, items }: Props) => {
  const theme = useTheme();
  const update = useUpdate();
  const chartRef = useRef<Chart<'bar'>>(null);
  const [chartData, setChartData] =
    useState<ChartData<'bar'>>(NO_BAR_CHART_DATA);

  // Update the component regularly because the chart depends on the time
  // elapsed since the last update so we need to keep it updated even if
  // we don't receive any new data from the server
  useHarmonicIntervalFn(update, 1000);

  // Construct the chart data when the component is mounted and every time
  // the items change
  useEffect(() => {
    const chart = chartRef.current;

    if (chart) {
      setChartData(
        items
          ? createDataFromItemsAndDrawingContext(items, chart.ctx)
          : NO_BAR_CHART_DATA
      );
    }
  }, [items]);

  return (
    <Box sx={{ height }}>
      <BarChart
        ref={chartRef}
        data={chartData}
        options={isThemeDark(theme) ? options.dark : options.light}
      />
    </Box>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    items: getDisplayedSatelliteCNRValues(state),
  }),
  // mapDispatchToProps
  {}
)(RTKSatelliteObservations);
