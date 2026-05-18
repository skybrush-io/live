import loadable from '@loadable/component';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import { createSelector } from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn } from 'react-use';

import { defaultFont, isThemeDark } from '@skybrush/app-theme-mui';

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

const maxSatelliteAgeMsec = 60000;

const gnssSystems = {
  C: 'BeiDou',
  E: 'Galileo',
  G: 'GPS',
  R: 'GLONASS',
  other: 'Other',
};

const gnssSystemOrder = ['G', 'R', 'E', 'C', 'other'];

const gnssSystemColors = {
  C: '#00acc1',
  E: '#7e57c2',
  G: '#2e7d32',
  R: '#ef6c00',
  other: '#616161',
};

const sampleSatelliteReadings = [
  ['G02', 52],
  ['G10', 47],
  ['G23', 39],
  ['G31', 55],
  ['R01', 49],
  ['R08', 36],
  ['R16', 43],
  ['E07', 51],
  ['E15', 46],
  ['E26', 54],
  ['C13', 56],
  ['C27', 41],
  ['C34', 44],
  ['C42', 53],
];

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

const getGNSSSystemCode = (satelliteId) => {
  const gnssSystemCode = satelliteId?.length > 0 ? satelliteId.charAt(0) : null;

  return gnssSystemCode && gnssSystems[gnssSystemCode]
    ? gnssSystemCode
    : 'other';
};

const isSatelliteCurrent = (item, now) =>
  now - item.lastUpdatedAt < maxSatelliteAgeMsec;

const countSatellitesByGNSSSystem = (items, now) => {
  const result = {};

  for (const item of items || []) {
    if (!isSatelliteCurrent(item, now)) {
      continue;
    }

    const code = getGNSSSystemCode(item.id);
    result[code] = (result[code] || 0) + 1;
  }

  return gnssSystemOrder
    .filter((code) => result[code])
    .map((code) => ({
      code,
      label: gnssSystems[code],
      color: gnssSystemColors[code],
      count: result[code],
    }));
};

const createSampleSatelliteItems = (now) =>
  sampleSatelliteReadings.map(([id, cnr], index) => ({
    id,
    cnr,
    lastUpdatedAt: now - index * 400,
  }));

/* ************************************************************************ */

const createDataFromItemsAndDrawingContext = (items, ctx, now) => {
  const gradients = createGradientFills(ctx);
  const processedItems = items
    .map((item) => {
      const ageMsec = now - item.lastUpdatedAt;

      if (ageMsec >= maxSatelliteAgeMsec) {
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

const RTKSatelliteObservations = ({ height = 160, items }) => {
  const theme = useTheme();
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(NO_DATA);
  const [now, setNow] = useState(Date.now());
  const isUsingSampleData = !items || items.length === 0;
  const effectiveItems = useMemo(
    () => (isUsingSampleData ? createSampleSatelliteItems(now) : items),
    [isUsingSampleData, items, now]
  );
  const satelliteCounts = useMemo(
    () => countSatellitesByGNSSSystem(effectiveItems, now),
    [effectiveItems, now]
  );

  // Update the component regularly because the chart depends on the time
  // elapsed since the last update so we need to keep it updated even if
  // we don't receive any new data from the server
  useHarmonicIntervalFn(() => {
    setNow(Date.now());
  }, 1000);

  // Construct the chart data when the component is mounted and every time
  // the items change
  useEffect(() => {
    const chart = chartRef.current;

    if (chart) {
      setChartData(
        effectiveItems
          ? createDataFromItemsAndDrawingContext(effectiveItems, chart.ctx, now)
          : NO_DATA
      );
    }
  }, [chartRef.current, effectiveItems, now]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height }}>
      {satelliteCounts.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            mb: 1,
            justifyContent: 'center',
          }}
        >
          {satelliteCounts.map(({ code, color, count, label }) => (
            <Box
              key={code}
              component='span'
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                border: `1px solid ${alpha(color, 0.45)}`,
                background: `linear-gradient(135deg, ${alpha(
                  color,
                  0.18
                )}, ${alpha(color, 0.05)})`,
                boxShadow: `inset 0 0 0 1px ${alpha(
                  '#fff',
                  isThemeDark(theme) ? 0.05 : 0.45
                )}`,
                color: 'text.primary',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              <Box
                component='span'
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: color,
                  boxShadow: `0 0 6px ${alpha(color, 0.75)}`,
                }}
              />
              <Box component='span' sx={{ color: 'text.secondary' }}>
                {label}
              </Box>
              <Box
                component='span'
                sx={{
                  ml: 0.25,
                  color,
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {count}
              </Box>
            </Box>
          ))}
          {isUsingSampleData && (
            <Box
              component='span'
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 999,
                bgcolor: 'action.hover',
                color: 'text.secondary',
                fontSize: 12,
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              sample
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <BarChart
          ref={chartRef}
          data={chartData}
          options={isThemeDark(theme) ? options.dark : options.light}
        />
      </Box>
    </Box>
  );
};

RTKSatelliteObservations.propTypes = {
  height: PropTypes.number,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      cnr: PropTypes.number,
      lastUpdatedAt: PropTypes.number,
    })
  ),
};

export default connect(
  // mapStateToProps
  (state) => ({
    items: getDisplayedSatelliteCNRValues(state),
  }),
  // mapDispatchToProps
  {}
)(RTKSatelliteObservations);
