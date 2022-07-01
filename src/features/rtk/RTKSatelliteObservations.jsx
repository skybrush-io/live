import loadable from '@loadable/component';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';
import { createSelector } from '@reduxjs/toolkit';

import Box from '@material-ui/core/Box';
import { useTheme } from '@material-ui/core/styles';
import { defaultFont, isThemeDark } from '@skybrush/app-theme-material-ui';

import Colors from '~/components/colors';
import { createGradientBackground, NO_DATA } from '~/utils/charts';

import { getDisplayedSatelliteCNRValues } from './selectors';

/* ************************************************************************ */

const BarChart = loadable(
  () => import(/* webpackChunkName: "charts" */ './BarChart'),
  {
    resolveComponent: ({ default: Bar }) => Bar,
  }
);

const cnrBoundaries = [30, 40];

const colors = ['#424242', Colors.error, Colors.warning, Colors.success];

const createGradientFills = createSelector(
  (ctx) => ctx,
  (ctx) => colors.map((color) => createGradientBackground({ ctx, color }))
);

const styleForCNR = (cnr) => {
  if (cnr <= 0 || isNil(cnr)) {
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

const createDataFromItemsAndDrawingContext = (items, ctx) => {
  const gradients = createGradientFills(ctx);
  const now = Date.now();
  const processedItems = items
    .map((item) => {
      const ageMsec = now - item.lastUpdatedAt;

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
    .filter(Boolean);

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

const createOptions = (isDark) => ({
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      titleFont: { family: defaultFont },
      bodyFont: { family: defaultFont },
      footerFont: { family: defaultFont },

      // specific to this chart
      callbacks: {
        label: (ctx) => ` ${ctx.formattedValue} dB-Hz`,
      },
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          // theme-specific
          color: isDark ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
          // all charts
          family: defaultFont,
          size: 14,
        },
      },
    },

    y: {
      // dark theme only
      grid: {
        borderColor: isDark
          ? ({ index }) => `rgba(255, 255, 255, ${index ? 0.17 : 0.34})`
          : ({ index }) => `rgba(0, 0, 0, ${index ? 0.17 : 0.34})`,
        color: isDark
          ? ({ index }) => `rgba(255, 255, 255, ${index ? 0.17 : 0.34})`
          : ({ index }) => `rgba(0, 0, 0, ${index ? 0.17 : 0.34})`,
      },
      suggestedMin: 0,
      suggestedMax: 60,
      ticks: {
        font: {
          // theme-specific
          color: isDark ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
          // all charts
          family: defaultFont,
          size: 14,
        },
        // specific to this chart
        maxTicksLimit: 7,
      },
    },
  },

  // required for all charts
  maintainAspectRatio: false,
});

const options = {
  dark: createOptions(true),
  light: createOptions(false),
};

const RTKSatelliteObservations = ({ height, items }) => {
  const theme = useTheme();
  const update = useUpdate();
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(NO_DATA);

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
        items ? createDataFromItemsAndDrawingContext(items, chart.ctx) : NO_DATA
      );
    }
  }, [chartRef.current, items]);

  return (
    <Box height={height}>
      <BarChart
        ref={chartRef}
        data={chartData}
        options={isThemeDark(theme) ? options.dark : options.light}
      />
    </Box>
  );
};

RTKSatelliteObservations.propTypes = {
  height: PropTypes.number,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      cnr: PropTypes.number,
      lastUpdatedAt: PropTypes.number,
    })
  ),
};

RTKSatelliteObservations.defaultProps = {
  height: 160,
};

export default connect(
  // mapStateToProps
  (state) => ({
    items: getDisplayedSatelliteCNRValues(state),
  }),
  // mapDispatchToProps
  {}
)(RTKSatelliteObservations);
