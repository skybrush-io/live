import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Battery from '@material-ui/icons/BatteryChargingFull';

import { colorForStatus, Status } from '@skybrush/app-theme-material-ui';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { BatteryFormatter } from '~/components/battery';
import { isConnected } from '~/features/servers/selectors';
import { getBatteryFormatter } from '~/features/settings/selectors';

import BatteryStatusUpdater from './BatteryStatusUpdater';

const BADGE_OFFSET = [24, 8];

const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 80,
};

const INITIAL_STATE = {
  avg: null,
  min: null,
};

const BatteryStatusHeaderButton = ({ formatter, isConnected, t }) => {
  const [{ avg, min }, setSummary] = useState(INITIAL_STATE);
  const batteryStatus = avg
    ? formatter.getBatteryStatus(avg.voltage, avg.percentage)
    : null;
  const badgeStatus = avg
    ? formatter.getSemanticBatteryStatus(avg.voltage, avg.percentage)
    : null;
  const badgeVisible = badgeStatus && badgeStatus !== Status.OFF;

  return (
    <Tooltip content={t('batteryStatusHeaderButton')}>
      <GenericHeaderButton
        disabled={!isConnected}
        label={
          isConnected && avg
            ? formatter.getBatteryLabel(avg.voltage, avg.percentage)
            : '—'
        }
        secondaryLabel={
          isConnected && min
            ? formatter.getBatteryLabel(min.voltage, min.percentage)
            : null
        }
        style={buttonStyle}
      >
        {batteryStatus ? (
          formatter.getLargeBatteryIcon(avg.percentage, batteryStatus)
        ) : (
          <Battery />
        )}
        <SidebarBadge
          anchor='topLeft'
          color={badgeVisible ? colorForStatus(badgeStatus) : null}
          offset={BADGE_OFFSET}
          visible={badgeVisible}
        />
        {isConnected && <BatteryStatusUpdater onSetStatus={setSummary} />}
      </GenericHeaderButton>
    </Tooltip>
  );
};

BatteryStatusHeaderButton.propTypes = {
  formatter: PropTypes.instanceOf(BatteryFormatter).isRequired,
  isConnected: PropTypes.bool,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    formatter: getBatteryFormatter(state),
    isConnected: isConnected(state),
  }),
  // mapDispatchToProps
  {}
)(withTranslation()(BatteryStatusHeaderButton));
