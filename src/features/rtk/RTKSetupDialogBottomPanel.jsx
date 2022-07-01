import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Place from '@material-ui/icons/Place';

import {
  createSecondaryAreaStyle,
  isThemeDark,
} from '@skybrush/app-theme-material-ui';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';

import { getSurveyStatus, shouldShowSurveySettings } from './selectors';
import { toggleSurveySettingsPanel } from './slice';

import AntennaPositionIndicator from './AntennaPositionIndicator';
import RTKSatelliteObservations from './RTKSatelliteObservations';
import SurveySettingsEditor from './SurveySettingsEditor';
import SurveyStatusIndicator from './SurveyStatusIndicator';

/* ************************************************************************ */

const useStyles = makeStyles(
  (theme) => ({
    root: {
      ...createSecondaryAreaStyle(theme),
    },

    inset: {
      border: `1px solid ${
        isThemeDark(theme) ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
      }`,
      boxShadow: '0 0 4px 2px inset rgba(0, 0, 0, 0.54)',
      padding: theme.spacing(1),
    },

    nonInset: {
      borderTop: `1px solid ${
        isThemeDark(theme) ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
      }`,
      boxShadow: '0 2px 6px -2px inset rgba(0, 0, 0, 0.54)',
      padding: theme.spacing(2, 3),
    },
  }),
  { name: 'ChartContainer' }
);

const RTKSetupDialogBottomPanel = ({
  chartHeight,
  inset,
  onToggleSurveySettings,
  surveySettingsVisible,
  surveyStatus,
}) => {
  const classes = useStyles();

  return (
    <Box
      className={clsx(classes.root, inset ? classes.inset : classes.nonInset)}
    >
      <RTKSatelliteObservations height={chartHeight} />

      <Box position='relative' height={48}>
        <FadeAndSlide in={!surveySettingsVisible}>
          <Box
            display='flex'
            flexDirection='row'
            alignItems='center'
            left={0}
            top={0}
            right={0}
            bottom={0}
          >
            {onToggleSurveySettings && (
              <Tooltip content='Start new survey'>
                <IconButton
                  disabled={!surveyStatus || !surveyStatus.supported}
                  onClick={onToggleSurveySettings}
                >
                  <Place />
                </IconButton>
              </Tooltip>
            )}
            <SurveyStatusIndicator {...surveyStatus} />
            <Box flex='1' />
            <AntennaPositionIndicator />
          </Box>
        </FadeAndSlide>
        <FadeAndSlide in={surveySettingsVisible}>
          <SurveySettingsEditor
            position='absolute'
            left={0}
            top={0}
            right={0}
            bottom={0}
          />
        </FadeAndSlide>
      </Box>
    </Box>
  );
};

RTKSetupDialogBottomPanel.propTypes = {
  chartHeight: PropTypes.number,
  inset: PropTypes.bool,
  onToggleSurveySettings: PropTypes.func,
  surveySettingsVisible: PropTypes.bool,
  surveyStatus: PropTypes.object,
};

RTKSetupDialogBottomPanel.defaultProps = {
  chartHeight: 160,
};

export default connect(
  // mapStateToProps
  (state) => ({
    surveyStatus: getSurveyStatus(state),
    surveySettingsVisible: shouldShowSurveySettings(state),
  }),
  // mapDispatchToProps
  {
    onToggleSurveySettings: toggleSurveySettingsPanel,
  }
)(RTKSetupDialogBottomPanel);
