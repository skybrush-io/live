import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { MiniListItem } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { getOverallRTKStatus } from './selectors';
import { RTKCorrectionStatus } from './types';
import { describeRTKStatus, getIconPresetForRTKStatus } from './utils';

type Props = {
  overallStatus: RTKCorrectionStatus;
};

const OverallRTKSurveyStatusMiniListItem = ({ overallStatus }: Props) => {
  const { t } = useTranslation();

  if (
    overallStatus === RTKCorrectionStatus.INACTIVE ||
    overallStatus === RTKCorrectionStatus.NOT_CONNECTED
  ) {
    return null;
  }

  return (
    <MiniListItem
      iconPreset={getIconPresetForRTKStatus(overallStatus)}
      primaryText={describeRTKStatus(overallStatus, {}, t)}
    />
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    overallStatus: getOverallRTKStatus(state),
  })
)(OverallRTKSurveyStatusMiniListItem);
