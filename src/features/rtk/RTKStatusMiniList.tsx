import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  MiniList,
  MiniListDivider,
  MiniListItem,
} from '@skybrush/mui-components';

import GPSFixStatusMiniList from '~/components/uavs/GPSFixStatusMiniList';
import type { RootState } from '~/store/reducers';

import {
  getOverallRTKStatus,
  getSatelliteIds,
  getSurveyStatus,
} from './selectors';
import { RTKCorrectionStatus } from './types';
import {
  describeRTKStatus,
  formatSurveyAccuracy,
  getIconPresetForRTKStatus,
} from './utils';

const listStyle = {
  minWidth: 150,
};

type GNSSSystemDescription = {
  name: string;
  flag: string;
};

const gnssSystems: Record<string, GNSSSystemDescription> = {
  C: {
    name: 'BeiDou',
    flag: '🇨🇳',
  },
  E: {
    name: 'Galileo',
    flag: '🇪🇺',
  },
  G: {
    name: 'GPS',
    flag: '🇺🇸',
  },
  R: {
    name: 'GLONASS',
    flag: '🇷🇺',
  },
  other: {
    name: 'Other',
    flag: '🏳',
  },
};

const gnssSystemOrder = ['G', 'R', 'E', 'C', 'other'];

const countSatellitesByGNSSSystem = (satelliteIds: string[]) => {
  const result: Record<string, number> = {};

  for (const satelliteId of satelliteIds) {
    let gnssSystemCode = satelliteId.length > 0 ? satelliteId.charAt(0) : null;

    if (!gnssSystemCode || !gnssSystems[gnssSystemCode]) {
      gnssSystemCode = 'other';
    }

    if (result[gnssSystemCode]) {
      result[gnssSystemCode]++;
    } else {
      result[gnssSystemCode] = 1;
    }
  }

  return result;
};

type Props = {
  overallStatus: RTKCorrectionStatus;
  satelliteIds: string[];
  surveyStatus: {
    accuracy?: number;
    active: boolean;
    supported: boolean;
    valid: boolean;
  };
};

const RTKStatusMiniList = ({
  overallStatus,
  satelliteIds,
  surveyStatus,
}: Props) => {
  const { t } = useTranslation();
  const counts = countSatellitesByGNSSSystem(satelliteIds);
  return (
    <MiniList style={listStyle}>
      {overallStatus !== RTKCorrectionStatus.INACTIVE &&
        overallStatus !== RTKCorrectionStatus.NOT_CONNECTED && (
          <MiniListItem
            iconPreset={getIconPresetForRTKStatus(overallStatus)}
            primaryText={describeRTKStatus(overallStatus, {}, t)}
          />
        )}
      {surveyStatus.supported && (
        <MiniListItem
          primaryText={
            surveyStatus.valid
              ? t('RTKStatusMiniList.surveySuccesful')
              : surveyStatus.active
                ? t('RTKStatusMiniList.surveyInProgress')
                : t('RTKStatusMiniList.surveyNo')
          }
          secondaryText={
            typeof surveyStatus.accuracy === 'number'
              ? formatSurveyAccuracy(surveyStatus.accuracy)
              : null
          }
          iconPreset={
            surveyStatus.valid
              ? 'success'
              : surveyStatus.active
                ? 'connecting'
                : 'disconnected'
          }
        />
      )}
      <MiniListItem
        primaryText={
          '\u00A0🌍\u00A0\u00A0\u00A0' + t('RTKStatusMiniList.satelliteCount')
        }
        secondaryText={String(satelliteIds.length)}
      />
      {satelliteIds.length > 0 && <MiniListDivider />}
      {gnssSystemOrder.map(
        (code) =>
          counts[code] && (
            <MiniListItem
              key={code}
              primaryText={`\u00A0${gnssSystems[code].flag}\u00A0\u00A0\u00A0${gnssSystems[code].name}`}
              secondaryText={counts[code]}
            />
          )
      )}
      <GPSFixStatusMiniList />
    </MiniList>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    overallStatus: getOverallRTKStatus(state),
    satelliteIds: getSatelliteIds(state),
    surveyStatus: getSurveyStatus(state),
  }),
  // mapDispatchToProps
  {}
)(RTKStatusMiniList);
