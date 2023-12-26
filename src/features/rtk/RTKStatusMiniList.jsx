import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListDivider from '@skybrush/mui-components/lib/MiniListDivider';
import MiniListItem from '@skybrush/mui-components/lib/MiniListItem';

import GPSFixStatusMiniList from '~/components/uavs/GPSFixStatusMiniList';

import { getSatelliteIds, getSurveyStatus } from './selectors';
import { formatSurveyAccuracy, RTKPropTypes } from './utils';

const listStyle = {
  minWidth: 150,
};

const gnssSystems = {
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

const countSatellitesByGNSSSystem = (satelliteIds) => {
  const result = {};

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

const RTKStatusMiniList = ({ satelliteIds, surveyStatus, t }) => {
  const counts = countSatellitesByGNSSSystem(satelliteIds);
  return (
    <MiniList style={listStyle}>
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

RTKStatusMiniList.propTypes = {
  satelliteIds: PropTypes.arrayOf(PropTypes.string),
  surveyStatus: RTKPropTypes.survey,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    satelliteIds: getSatelliteIds(state),
    surveyStatus: getSurveyStatus(state),
  }),
  // mapDispatchToProps
  {}
)(withTranslation()(RTKStatusMiniList));
