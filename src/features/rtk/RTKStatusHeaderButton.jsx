import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { colorForStatus, Status } from '@skybrush/app-theme-material-ui';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import LazyTooltip from '@skybrush/mui-components/lib/LazyTooltip';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import { isConnected } from '~/features/servers/selectors';
import Satellite from '~/icons/Satellite';

import RTKStatusMiniList from './RTKStatusMiniList';
import RTKStatusUpdater from './RTKStatusUpdater';
import {
  getNumberOfGoodSatellites,
  getNumberOfSatellites,
  getSurveyStatus,
} from './selectors';
import { showRTKSetupDialog } from './slice';
import { formatSurveyAccuracy, RTKPropTypes } from './utils';

const BADGE_OFFSET = [24, 8];

const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 80,
};

const RTKStatusHeaderButton = ({
  isConnected,
  numGoodSatellites,
  numSatellites,
  showRTKSetupDialog,
  surveyStatus,
}) => {
  let badgeStatus = null;
  const hasError = false;

  if (isConnected) {
    if (hasError) {
      // If we have an RTK-related error, show an error badge
      // TODO(ntamas): right now we never report an error; what conditions
      // shall we prepare for here?
      badgeStatus = Status.ERROR;
    } else if (surveyStatus.supported) {
      // If the RTK device supports surveying, show the survey status
      badgeStatus = surveyStatus.valid
        ? Status.SUCCESS
        : surveyStatus.active
        ? Status.NEXT
        : Status.ERROR;
    } else {
      // If the RTK device does not support surveying, simply show success if
      // we have info about at least one satellite
      badgeStatus = numSatellites > 1 ? Status.SUCCESS : null;
    }

    // If the badge would be green but we do not have enough good satellites,
    // show a warning instead
    if (badgeStatus === Status.SUCCESS && numGoodSatellites < 7) {
      badgeStatus = Status.WARNING;
    }
  }

  return (
    <LazyTooltip interactive content={<RTKStatusMiniList />}>
      <GenericHeaderButton
        disabled={!isConnected}
        label={
          isConnected ? (numSatellites > 0 ? String(numSatellites) : '—') : '—'
        }
        secondaryLabel={
          surveyStatus.supported && typeof surveyStatus.accuracy === 'number'
            ? formatSurveyAccuracy(surveyStatus.accuracy, {
                max: 9,
                short: true,
              })
            : null
        }
        style={buttonStyle}
        onClick={showRTKSetupDialog}
      >
        <Satellite />
        <SidebarBadge
          anchor='topLeft'
          color={badgeStatus ? colorForStatus(badgeStatus) : null}
          offset={BADGE_OFFSET}
          visible={Boolean(badgeStatus)}
        />
        {isConnected && <RTKStatusUpdater />}
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

RTKStatusHeaderButton.propTypes = {
  isConnected: PropTypes.bool,
  numGoodSatellites: PropTypes.number,
  numSatellites: PropTypes.number,
  showRTKSetupDialog: PropTypes.func,
  surveyStatus: RTKPropTypes.survey,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
    numGoodSatellites: getNumberOfGoodSatellites(state),
    numSatellites: getNumberOfSatellites(state),
    surveyStatus: getSurveyStatus(state),
  }),
  // mapDispatchToProps
  {
    showRTKSetupDialog,
  }
)(RTKStatusHeaderButton);
