import clsx from 'clsx';
import copy from 'copy-to-clipboard';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';
import { createSelector } from '@reduxjs/toolkit';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import Colors from '~/components/colors';
import Tooltip from '~/components/Tooltip';
import { showNotification } from '~/features/snackbar/slice';
import ContentCopy from '~/icons/ContentCopy';
import { createSecondaryAreaStyle, defaultFont, isDark } from '~/theme';
import { createGradientBackground } from '~/utils/charts';

import {
  getAntennaInfoSummary,
  getDisplayedSatelliteCNRValues,
  getFormattedAntennaPosition,
  getSurveyStatus,
} from './selectors';
import SurveyStatusIndicator from './SurveyStatusIndicator';

/* ************************************************************************ */

const cnrBoundaries = [30, 40];

const colors = ['#444', Colors.error, Colors.warning, Colors.success];

const createGradientFills = createSelector(
  (canvas) => canvas,
  (canvas) => colors.map((color) => createGradientBackground({ canvas, color }))
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

const createDataFromItems = (items) => (canvas) => {
  const gradients = createGradientFills(canvas);
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
  legend: {
    display: false,
  },

  scales: {
    xAxes: [
      {
        ticks: {
          // theme-specific
          fontColor: isDark
            ? 'rgba(255, 255, 255, 0.54)'
            : 'rgba(0, 0, 0, 0.54)',
          // all charts
          fontFamily: defaultFont,
          fontSize: 14,
        },
      },
    ],

    yAxes: [
      {
        // dark theme only
        gridLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.17)' : 'rgba(0, 0, 0, 0.17)',
          zeroLineColor: isDark
            ? 'rgba(255, 255, 255, 0.34)'
            : 'rgba(0, 0, 0, 0.34)',
        },
        ticks: {
          // all charts
          fontFamily: defaultFont,
          fontSize: 14,
          // theme-specific
          fontColor: isDark
            ? 'rgba(255, 255, 255, 0.54)'
            : 'rgba(0, 0, 0, 0.54)',
          // specific to this chart
          maxTicksLimit: 7,
          suggestedMin: 0,
          suggestedMax: 60,
        },
      },
    ],
  },

  // required for all charts
  maintainAspectRatio: false,
  tooltips: {
    titleFontFamily: defaultFont,
    bodyFontFamily: defaultFont,
    footerFontFamily: defaultFont,

    // specific to this chart
    callbacks: {
      label: (tooltipItem) => `${tooltipItem.yLabel} dB-Hz`,
    },
  },
});

const options = {
  dark: createOptions(true),
  light: createOptions(false),
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      ...createSecondaryAreaStyle(theme),
    },

    inset: {
      border: `1px solid ${
        isDark(theme) ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
      }`,
      boxShadow: '0 0 4px 2px inset rgba(0, 0, 0, 0.54)',
      padding: theme.spacing(1),
    },

    nonInset: {
      borderTop: `1px solid ${
        isDark(theme) ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
      }`,
      boxShadow: '0 2px 6px -2px inset rgba(0, 0, 0, 0.54)',
      padding: theme.spacing(3),
    },
  }),
  { name: 'ChartContainer' }
);

const RTKSatelliteObservations = ({
  antennaInfo,
  chartHeight,
  inset,
  items,
  onCopyAntennaPositionToClipboard,
  surveyInStatus,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const update = useUpdate();

  const hasAntennaInfo = Boolean(antennaInfo.position);

  // Update the component regularly because the chart depends on the time
  // elapsed since the last update so we need to keep it updated even if
  // we don't receive any new data from the server
  useHarmonicIntervalFn(update, 1000);

  return (
    <Box
      className={clsx(classes.root, inset ? classes.inset : classes.nonInset)}
    >
      <Box height={chartHeight}>
        <Bar
          data={createDataFromItems(items)}
          options={isDark(theme) ? options.dark : options.light}
        />
      </Box>
      {antennaInfo && (
        <Box display='flex' flexDirection='row' alignItems='center'>
          <SurveyStatusIndicator {...surveyInStatus} />
          <Typography variant='body2' component='div' color='textSecondary'>
            {antennaInfo.description}
          </Typography>
          <Box flex='1' />
          <Typography
            variant='body2'
            component='div'
            color={hasAntennaInfo ? 'textPrimary' : 'textSecondary'}
          >
            {antennaInfo.position || 'Antenna position not known'}
          </Typography>
          {onCopyAntennaPositionToClipboard && (
            <Tooltip content='Copy to clipboard'>
              <IconButton
                disabled={!hasAntennaInfo}
                onClick={onCopyAntennaPositionToClipboard}
              >
                <ContentCopy />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

RTKSatelliteObservations.propTypes = {
  antennaInfo: PropTypes.shape({
    description: PropTypes.string,
    position: PropTypes.string,
  }),
  chartHeight: PropTypes.number,
  inset: PropTypes.bool,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      cnr: PropTypes.number,
      lastUpdatedAt: PropTypes.number,
    })
  ),
  onCopyAntennaPositionToClipboard: PropTypes.func,
  surveyInStatus: PropTypes.object,
};

RTKSatelliteObservations.defaultProps = {
  chartHeight: 150,
};

export default connect(
  // mapStateToProps
  (state) => ({
    antennaInfo: getAntennaInfoSummary(state),
    items: getDisplayedSatelliteCNRValues(state),
    surveyInStatus: getSurveyStatus(state),
  }),
  // mapDispatchToProps
  {
    onCopyAntennaPositionToClipboard: () => (dispatch, getState) => {
      copy(getFormattedAntennaPosition(getState()));
      dispatch(showNotification('Coordinates copied to clipboard.'));
    },
  }
)(RTKSatelliteObservations);
