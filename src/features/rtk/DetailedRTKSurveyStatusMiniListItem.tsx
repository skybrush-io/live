import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { MiniListItem } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { getSurveyStatus } from './selectors';
import { formatSurveyAccuracy } from './utils';

type Props = {
  accuracy?: number;
  active: boolean;
  supported: boolean;
  valid: boolean;
};

const DetailedRTKSurveyStatusMiniListItem = ({
  accuracy,
  active,
  supported,
  valid,
}: Props) => {
  const { t } = useTranslation();

  if (!supported) {
    return null;
  }

  return (
    <MiniListItem
      primaryText={
        valid
          ? t('RTKStatusMiniList.surveySuccesful')
          : active
            ? t('RTKStatusMiniList.surveyInProgress')
            : t('RTKStatusMiniList.surveyNo')
      }
      secondaryText={
        typeof accuracy === 'number' ? formatSurveyAccuracy(accuracy) : null
      }
      iconPreset={valid ? 'success' : active ? 'connecting' : 'disconnected'}
    />
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => getSurveyStatus(state)
)(DetailedRTKSurveyStatusMiniListItem);
