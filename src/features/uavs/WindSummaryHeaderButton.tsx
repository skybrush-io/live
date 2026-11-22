import Navigation from '@mui/icons-material/Navigation';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { colorForStatus, Status } from '@skybrush/app-theme-mui';
import {
  GenericHeaderButton,
  SidebarBadge,
  Tooltip,
} from '@skybrush/mui-components';

import { isConnected } from '~/features/servers/selectors';
import { getWindSpeedThresholds } from '~/features/settings/selectors';
import { usePeriodicSelector } from '~/hooks/usePeriodicSelector';
import { getMapViewRotationAngle } from '~/selectors/map';
import type { RootState } from '~/store/reducers';
import { formatSpeed } from '~/utils/formatting';
import {
  getCompassDirection,
  summarizeWindEstimates,
  type WindSummary,
} from '~/utils/wind';

import { getActiveAndAwakeUAVIds, getUAVById } from './selectors';

const BADGE_OFFSET = [24, 8];

const buttonStyle: CSSProperties = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 95,
};

/**
 * Values that can be shown in the two lines of the widget. To change what the
 * widget shows, change `PRIMARY_VALUE` and `SECONDARY_VALUE` below.
 */
type SummaryValue = 'meanSpeed' | 'maxSpeed';

const PRIMARY_VALUE: SummaryValue = 'meanSpeed';
const SECONDARY_VALUE: SummaryValue = 'maxSpeed';

const findWindSummary = (state: RootState): WindSummary =>
  summarizeWindEstimates(
    // Exclude sleeping UAVs because they most likely do not report a current estimate.
    getActiveAndAwakeUAVIds(state).flatMap((uavId) => {
      const wind = getUAVById(state, uavId)?.wind;
      return wind ? [wind] : [];
    })
  );

type WindSummaryHeaderButtonProps = {
  isConnected: boolean;
  mapRotationAngle: number;
  thresholds: { warning: number; error: number };
};

const WindSummaryHeaderButton = ({
  isConnected,
  mapRotationAngle,
  thresholds,
}: WindSummaryHeaderButtonProps) => {
  const { t } = useTranslation();
  const summary = usePeriodicSelector(findWindSummary, 1000);

  const hasEstimate = isConnected && summary.count > 0;
  const formatValue = (value: SummaryValue) =>
    hasEstimate ? formatSpeed(summary[value], 1) : '—';

  const badgeStatus =
    summary.maxSpeed >= thresholds.error
      ? Status.ERROR
      : summary.maxSpeed >= thresholds.warning
        ? Status.WARNING
        : Status.OFF;
  const badgeVisible = hasEstimate && badgeStatus !== Status.OFF;

  // The icon points north when not rotated and the direction of the estimate
  // is where the wind blows _from_, so the arrow needs to be flipped. The map
  // rotation is subtracted to keep the arrow consistent with the map.
  const iconRotation = hasEstimate
    ? summary.meanDirection + 180 - mapRotationAngle
    : 0;

  const direction = Math.round(summary.meanDirection) % 360;
  const tooltip = hasEstimate ? (
    <>
      <div>
        {t('header.windSummary.average')}: {formatSpeed(summary.meanSpeed, 1)}
      </div>
      <div>
        {t('header.windSummary.max')}: {formatSpeed(summary.maxSpeed, 1)}
      </div>
      <div>
        {t('header.windSummary.direction', {
          direction,
          compass: getCompassDirection(summary.meanDirection),
        })}
      </div>
      <div>{t('header.windSummary.estimatedBy', { count: summary.count })}</div>
    </>
  ) : (
    t('header.windSummary.noEstimate')
  );

  return (
    <Tooltip content={tooltip}>
      <GenericHeaderButton
        disabled={!isConnected}
        label={formatValue(PRIMARY_VALUE)}
        secondaryLabel={formatValue(SECONDARY_VALUE)}
        style={buttonStyle}
      >
        <Navigation
          style={{
            opacity: hasEstimate ? 1 : 0.4,
            transform: `rotate(${iconRotation}deg)`,
          }}
        />
        <SidebarBadge
          anchor='topLeft'
          color={badgeVisible ? colorForStatus(badgeStatus) : undefined}
          offset={BADGE_OFFSET}
          visible={badgeVisible}
        />
      </GenericHeaderButton>
    </Tooltip>
  );
};

export default connect((state: RootState) => ({
  isConnected: isConnected(state),
  mapRotationAngle: getMapViewRotationAngle(state),
  thresholds: getWindSpeedThresholds(state),
}))(WindSummaryHeaderButton);
