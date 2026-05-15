import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  LazyTooltip,
  SidebarBadge,
} from '@skybrush/mui-components';

import { isConnected } from '~/features/servers/selectors';
import Satellite from '~/icons/Satellite';
import type { RootState } from '~/store/reducers';

import RTKStatusMiniList from './RTKStatusMiniList';
import RTKStatusUpdater from './RTKStatusUpdater';
import {
  getNumberOfSatellites,
  getOverallRTKStatus,
  getSurveyStatus,
} from './selectors';
import { showRTKSetupDialog } from './slice';
import type { RTKCorrectionStatus } from './types';
import { formatSurveyAccuracy, getColorOfRTKStatus } from './utils';

const BADGE_OFFSET = [24, 8];

const buttonStyle: React.CSSProperties = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 80,
};

type RTKStatusHeaderButtonProps = {
  isConnected: boolean;
  numSatellites: number;
  overallStatus: RTKCorrectionStatus;
  showRTKSetupDialog: () => void;
  surveyStatus: {
    accuracy?: number;
    active: boolean;
    supported: boolean;
    valid: boolean;
  };
};

const RTKStatusHeaderButton = ({
  isConnected,
  numSatellites,
  showRTKSetupDialog,
  overallStatus,
  surveyStatus,
}: RTKStatusHeaderButtonProps) => {
  const badgeColor = getColorOfRTKStatus(overallStatus);

  return (
    <LazyTooltip interactive content={<RTKStatusMiniList />}>
      <GenericHeaderButton
        disabled={!isConnected}
        label={isConnected && numSatellites > 0 ? String(numSatellites) : '—'}
        secondaryLabel={
          surveyStatus.supported && typeof surveyStatus.accuracy === 'number'
            ? formatSurveyAccuracy(surveyStatus.accuracy, { max: 9 })
            : null
        }
        style={buttonStyle}
        onClick={showRTKSetupDialog}
      >
        <Satellite />
        <SidebarBadge
          anchor='topLeft'
          color={badgeColor}
          offset={BADGE_OFFSET}
          visible={Boolean(badgeColor)}
        />
        {isConnected && <RTKStatusUpdater />}
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isConnected: isConnected(state),
    numSatellites: getNumberOfSatellites(state),
    overallStatus: getOverallRTKStatus(state),
    surveyStatus: getSurveyStatus(state),
  }),
  // mapDispatchToProps
  {
    showRTKSetupDialog,
  }
)(RTKStatusHeaderButton);
