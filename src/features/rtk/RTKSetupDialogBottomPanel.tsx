import Place from '@mui/icons-material/Place';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import clsx from 'clsx';
import { useEffect } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  createSecondaryAreaStyle,
  isThemeDark,
  makeStyles,
} from '@skybrush/app-theme-mui';
import { Tooltip } from '@skybrush/mui-components';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import type { RootState } from '~/store/reducers';

import {
  getCurrentRTKPresetId,
  getSurveyStatus,
  hasSavedCoordinateForPreset,
  shouldShowSurveySettings,
} from './selectors';
import {
  showCoordinateRestorationDialog,
  toggleSurveySettingsPanel,
} from './slice';

import AntennaPositionIndicator from './AntennaPositionIndicator';
import RTKSatelliteObservations from './RTKSatelliteObservations';
import SurveySettingsEditor from './SurveySettingsEditor';
import SurveyStatusIndicator from './SurveyStatusIndicator';

/* ************************************************************************ */

const useStyles = makeStyles((theme) => ({
  root: {
    ...createSecondaryAreaStyle(theme),
    display: 'flex',
    flexDirection: 'column',
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
}));

type Props = {
  chartHeight?: number;
  currentPresetId?: string;
  hasSavedCoordinates: boolean;
  inset?: boolean;
  onShowSavedCoordinates?: (presetId: string) => void;
  onToggleSurveySettings?: () => void;
  surveySettingsVisible: boolean;
  surveyStatus: {
    accuracy?: number;
    supported: boolean;
    active: boolean;
    valid: boolean;
  };
} & WithTranslation;

const RTKSetupDialogBottomPanel = ({
  chartHeight = 160,
  currentPresetId,
  hasSavedCoordinates,
  inset,
  onShowSavedCoordinates,
  onToggleSurveySettings,
  surveySettingsVisible,
  surveyStatus,
  t,
}: Props) => {
  const classes = useStyles();

  useEffect(() => {
    if (
      surveySettingsVisible &&
      !surveyStatus?.supported &&
      onToggleSurveySettings
    ) {
      onToggleSurveySettings();
    }
  }, [onToggleSurveySettings, surveySettingsVisible, surveyStatus?.supported]);

  const handleShowSavedCoordinates = () => {
    if (currentPresetId) {
      onShowSavedCoordinates?.(currentPresetId);
    }
  };

  return (
    <Box
      className={clsx(classes.root, inset ? classes.inset : classes.nonInset)}
    >
      <RTKSatelliteObservations height={chartHeight} />
      <Box sx={{ position: 'relative', height: 48 }}>
        <FadeAndSlide in={!surveySettingsVisible}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {onToggleSurveySettings && (
              <Tooltip content={t('rtkSetupDialog.startNewSurvey')}>
                <IconButton
                  disabled={!surveyStatus || !surveyStatus.supported}
                  edge='start'
                  size='large'
                  onClick={onToggleSurveySettings}
                >
                  <Place />
                </IconButton>
              </Tooltip>
            )}
            <SurveyStatusIndicator {...surveyStatus} />
            <Box sx={{ flex: '1' }} />
            <AntennaPositionIndicator
              hasSavedCoordinates={hasSavedCoordinates}
              onShowSavedCoordinates={
                onShowSavedCoordinates && handleShowSavedCoordinates
              }
            />
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

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const currentPresetId = getCurrentRTKPresetId(state);
    return {
      currentPresetId,
      hasSavedCoordinates:
        Boolean(currentPresetId) &&
        hasSavedCoordinateForPreset(state, currentPresetId),
      surveyStatus: getSurveyStatus(state),
      surveySettingsVisible: shouldShowSurveySettings(state),
    };
  },
  // mapDispatchToProps
  {
    onShowSavedCoordinates: showCoordinateRestorationDialog,
    onToggleSurveySettings: toggleSurveySettingsPanel,
  }
)(withTranslation()(RTKSetupDialogBottomPanel));
