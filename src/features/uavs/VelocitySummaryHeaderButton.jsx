import isNil from 'lodash-es/isNil';
import maxBy from 'lodash-es/maxBy';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import { Speed } from '@material-ui/icons';
import { isConnected } from '~/features/servers/selectors';
import { usePeriodicSelector } from '~/hooks/usePeriodicSelector';
import { formatSpeed } from '~/utils/formatting';

import { buttonStyle } from './AltitudeSummaryHeaderButton';
import { getActiveUAVIds, getUAVById } from './selectors';

const findVelocities = (state) => {
  let maxHorizontal = 0;
  let maxVertical = 0;

  for (const uavId of getActiveUAVIds(state)) {
    const uav = getUAVById(state, uavId);
    const velocity = uav.velocity ?? uav.velocityXYZ;

    if (!isNil(velocity)) {
      const horizontal = Math.hypot(velocity[0], velocity[1]);
      // Flip from NED to NEU, but keep the value if it's XYZ
      const vertical = uav.velocity ? -velocity[2] : velocity[2];

      maxHorizontal = Math.max(maxHorizontal, horizontal);
      maxVertical = maxBy([maxVertical, vertical], Math.abs);
    }
  }

  return { maxHorizontal, maxVertical };
};

const VelocitySummaryHeaderButton = ({ isConnected }) => {
  const { maxHorizontal, maxVertical } = usePeriodicSelector(
    findVelocities,
    isConnected ? 1000 : null
  );

  const { t } = useTranslation();

  return (
    <GenericHeaderButton
      disabled={!isConnected}
      label={
        isConnected && Number.isFinite(maxHorizontal)
          ? formatSpeed(maxHorizontal, 1)
          : '—'
      }
      secondaryLabel={
        isConnected && Number.isFinite(maxVertical)
          ? formatSpeed(maxVertical, 1)
          : '—'
      }
      style={{ ...buttonStyle, width: 105 }}
      tooltip={t('header.velocitySummary')}
    >
      <Speed />
    </GenericHeaderButton>
  );
};

VelocitySummaryHeaderButton.propTypes = {
  isConnected: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
  })
)(VelocitySummaryHeaderButton);
