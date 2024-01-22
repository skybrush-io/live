import isNil from 'lodash-es/isNil';
import reject from 'lodash-es/reject';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Straighten from '@material-ui/icons/Straighten';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import { isConnected } from '~/features/servers/selectors';
import { usePeriodicSelector } from '~/hooks/usePeriodicSelector';
import { formatDistance } from '~/utils/formatting';

import {
  buttonStyle,
  iconContainerStyle,
  typeIndicatorStyle,
} from './AltitudeSummaryHeaderButton';
import { getDistancesFromHome } from './selectors';

const findDistances = (state) => {
  const distances = reject(Object.values(getDistancesFromHome(state)), isNil);
  return { min: Math.min(...distances), max: Math.max(...distances) };
};

const DistanceSummaryHeaderButton = ({ isConnected }) => {
  const { max, min } = usePeriodicSelector(
    findDistances,
    isConnected ? 1000 : null
  );

  const { t } = useTranslation();

  return (
    <GenericHeaderButton
      disabled={!isConnected}
      label={isConnected && Number.isFinite(max) ? formatDistance(max, 1) : '—'}
      secondaryLabel={
        isConnected && Number.isFinite(min) ? formatDistance(min, 1) : '—'
      }
      style={buttonStyle}
      tooltip={t('header.distanceSummary')}
    >
      <div style={iconContainerStyle}>
        <Straighten />
        <div style={typeIndicatorStyle}>home</div>
      </div>
    </GenericHeaderButton>
  );
};

DistanceSummaryHeaderButton.propTypes = {
  isConnected: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
  })
)(DistanceSummaryHeaderButton);
