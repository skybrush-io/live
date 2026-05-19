import BatteryStd from '@mui/icons-material/BatteryStd';
import Explore from '@mui/icons-material/Explore';
import FlightLand from '@mui/icons-material/FlightLand';
import GpsFixed from '@mui/icons-material/GpsFixed';
import Height from '@mui/icons-material/Height';
import Place from '@mui/icons-material/Place';
import Route from '@mui/icons-material/Route';
import SatelliteAlt from '@mui/icons-material/SatelliteAlt';
import Settings from '@mui/icons-material/Settings';
import WarningAmber from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import createColor from 'color';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import { colorForStatus } from '~/components/colors';
import { Status as SemanticStatus } from '~/components/semantics';
import { getBatteryFormatter } from '~/features/settings/selectors';
import { hasActiveGeofencePolygon } from '~/features/mission/selectors';
import {
  hasScheduledStartTime,
  isExternalShowUploaded,
  isShowOutdoor,
} from '~/features/show/selectors';
import { getUploadStatusCodeMapping } from '~/features/upload/selectors';
import { getBatteryLevelStyle, resolveBatteryPercentage } from '~/features/uavs/batteryLevel';
import { isPathUploadedForUav, getPathUploadPillStyle } from '~/features/uavs/pathUpload';
import {
  getSingleUAVStatusSummary,
  getUAVById,
} from '~/features/uavs/selectors';
import {
  getUavAlert,
  getUavAlertPillStyle,
  resolveUavAlertBatteryPercentage,
} from '~/features/uavs/uavAlert';
import {
  abbreviateFlightMode,
  abbreviateGPSFixType,
  getSemanticsForGPSFixType,
} from '~/model/enums';

const PANEL = {
  width: 248,
  bg: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  shadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  text: '#1a1a1a',
  muted: 'rgba(0, 0, 0, 0.55)',
  chipBg: 'rgba(0, 0, 0, 0.04)',
};

const displayValue = (value, suffix = '') => {
  const text = String(value ?? '').trim();
  return text ? `${text}${suffix}` : '—';
};

const pillStyleFromSemantics = (semantics) => {
  const backgroundColor = colorForStatus(semantics ?? SemanticStatus.OFF);
  return {
    backgroundColor,
    color: createColor(backgroundColor).isLight() ? '#000' : '#fff',
  };
};

/** Pill/filled-list colors applied to the whole metric card (not just the value text). */
const tileStyleFromPill = (pillStyle) => {
  if (!pillStyle?.backgroundColor) {
    return undefined;
  }

  const backgroundColor = pillStyle.backgroundColor;
  const foreground =
    pillStyle.color ??
    (createColor(backgroundColor).isLight() ? '#000' : '#fff');
  const labelColor = createColor(foreground).alpha(0.72).string();

  return {
    backgroundColor,
    color: foreground,
    labelColor,
  };
};

const MetricTile = ({ icon: Icon, label, value, tileStyle }) => {
  const filled = Boolean(tileStyle?.backgroundColor);
  const foreground = tileStyle?.color ?? PANEL.text;
  const labelColor = filled ? tileStyle.labelColor : PANEL.muted;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.75,
        p: 0.75,
        borderRadius: 1,
        bgcolor: filled ? tileStyle.backgroundColor : PANEL.chipBg,
        color: foreground,
        minWidth: 0,
        border: filled ? 'none' : `1px solid rgba(0, 0, 0, 0.06)`,
      }}
    >
      <Icon
        sx={{
          fontSize: 16,
          color: foreground,
          mt: 0.15,
          flexShrink: 0,
          opacity: filled ? 0.92 : 0.55,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: 10, color: labelColor, lineHeight: 1.2 }}>{label}</Box>
        <Box
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: foreground,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Box>
      </Box>
    </Box>
  );
};

MetricTile.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  tileStyle: PropTypes.shape({
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    labelColor: PropTypes.string,
  }),
};

const StatusBadge = ({ label, style }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.75,
      mb: 1,
      py: 0.6,
      px: 1,
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      ...style,
    }}
  >
    <FlightLand sx={{ fontSize: 16 }} />
    {label}
  </Box>
);

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
};

const PillBadge = ({ label, style, icon: Icon = null }) => (
  <Box
    title={label}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
      mb: 0.75,
      py: 0.35,
      px: 0.85,
      borderRadius: 1,
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: 0.2,
      ...style,
    }}
  >
    {Icon ? <Icon sx={{ fontSize: 14 }} /> : null}
    {label}
  </Box>
);

PillBadge.propTypes = {
  label: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
  icon: PropTypes.elementType,
};

export const buildDroneTelemetryItems = (
  drone,
  { batteryStyle, gpsFixType, mode, pathUploaded, linked }
) => {
  const gpsLabel =
    linked && gpsFixType !== undefined
      ? abbreviateGPSFixType(gpsFixType) || '—'
      : displayValue(drone?.gpsFix);

  const modeLabel =
    linked && mode ? abbreviateFlightMode(mode) || displayValue(drone?.mode) : displayValue(drone?.mode);

  const gpsTileStyle =
    linked && gpsFixType !== undefined
      ? tileStyleFromPill(pillStyleFromSemantics(getSemanticsForGPSFixType(gpsFixType)))
      : undefined;

  const batteryTileStyle = tileStyleFromPill(batteryStyle);
  const pathTileStyle = linked ? tileStyleFromPill(getPathUploadPillStyle(pathUploaded)) : undefined;

  const items = [
    { key: 'mode', icon: Settings, label: '모드', value: modeLabel },
    {
      key: 'gps',
      icon: GpsFixed,
      label: 'GPS',
      value: gpsLabel,
      tileStyle: gpsTileStyle,
    },
    {
      key: 'sats',
      icon: SatelliteAlt,
      label: '위성',
      value: displayValue(drone?.satellites),
    },
    {
      key: 'battery',
      icon: BatteryStd,
      label: '배터리',
      value: displayValue(drone?.battery),
      tileStyle: batteryTileStyle,
    },
    {
      key: 'batteryPct',
      icon: BatteryStd,
      label: '충전량',
      value: displayValue(drone?.batteryPercentage, '%'),
      tileStyle: batteryTileStyle,
    },
    {
      key: 'heading',
      icon: Explore,
      label: '방향',
      value: displayValue(drone?.heading, '°'),
    },
    { key: 'ahl', icon: Height, label: 'AHL', value: displayValue(drone?.ahl, ' m') },
    { key: 'amsl', icon: Height, label: 'AMSL', value: displayValue(drone?.amsl, ' m') },
    { key: 'agl', icon: Height, label: 'AGL', value: displayValue(drone?.agl, ' m') },
  ];

  if (linked) {
    items.splice(2, 0, {
      key: 'path',
      icon: Route,
      label: 'Path',
      value: pathUploaded ? 'OK' : 'NO',
      tileStyle: pathTileStyle,
    });
  }

  return items;
};

const DroneStatusOverlayPresentation = ({
  alert,
  batteryStyle,
  drone,
  gpsFixType,
  linked,
  mode,
  pathUploaded,
  statusLabel,
  statusStyle,
}) => {
  const telemetryItems = useMemo(
    () =>
      buildDroneTelemetryItems(drone, {
        batteryStyle,
        gpsFixType,
        mode,
        pathUploaded,
        linked,
      }),
    [batteryStyle, drone, gpsFixType, mode, pathUploaded, linked]
  );

  const currentPositionText = useMemo(() => {
    const pos = drone?.currentPosition;
    if (!pos) return null;
    const px = Number(pos.x);
    const py = Number(pos.y);
    const pz = Number(pos.z);
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) {
      return null;
    }
    return `${px.toFixed(2)}, ${py.toFixed(2)}, ${pz.toFixed(2)}`;
  }, [drone?.currentPosition]);

  if (!drone?.id) return null;

  const displayStatus = String(statusLabel || drone?.status || '—').toUpperCase();
  const headerBatteryTile = tileStyleFromPill(batteryStyle);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10001,
        width: PANEL.width,
        maxWidth: `min(${PANEL.width}px, calc(100vw - 24px))`,
        borderRadius: 2,
        border: PANEL.border,
        bgcolor: PANEL.bg,
        color: PANEL.text,
        p: 1.25,
        boxSizing: 'border-box',
        boxShadow: PANEL.shadow,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
          mb: 0.75,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ fontSize: 10, color: PANEL.muted, fontWeight: 500 }}>드론 상태</Box>
          <Box sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{drone.id}</Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.35 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              ...(headerBatteryTile
                ? {
                    bgcolor: headerBatteryTile.backgroundColor,
                    color: headerBatteryTile.color,
                  }
                : {}),
            }}
          >
            <BatteryStd
              sx={{
                fontSize: 14,
                color: headerBatteryTile?.color ?? PANEL.muted,
              }}
            />
            <Box sx={{ fontSize: 12, fontWeight: 700 }}>
              {displayValue(drone?.battery)}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Explore sx={{ fontSize: 14, color: PANEL.muted }} />
            <Box sx={{ fontSize: 12, fontWeight: 600 }}>{displayValue(drone?.heading, '°')}</Box>
          </Box>
        </Box>
      </Box>

      {linked && alert?.label ? (
        <PillBadge
          icon={WarningAmber}
          label={alert.label}
          style={getUavAlertPillStyle(alert.level)}
        />
      ) : null}

      <StatusBadge label={displayStatus} style={statusStyle} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0.5,
        }}
      >
        {telemetryItems.map((item) => (
          <MetricTile
            key={item.key}
            icon={item.icon}
            label={item.label}
            value={item.value}
            tileStyle={item.tileStyle}
          />
        ))}
      </Box>

      {currentPositionText && (
        <Box
          sx={{
            mt: 0.75,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.75,
            p: 0.75,
            borderRadius: 1,
            bgcolor: PANEL.chipBg,
          }}
        >
          <Place sx={{ fontSize: 16, color: PANEL.muted, mt: 0.1 }} />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 10, color: PANEL.muted }}>위치 (x, y, z)</Box>
            <Box sx={{ fontSize: 11.5, fontWeight: 500, fontFamily: 'monospace' }}>
              {currentPositionText}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

DroneStatusOverlayPresentation.propTypes = {
  alert: PropTypes.shape({
    label: PropTypes.string,
    level: PropTypes.string,
    title: PropTypes.string,
  }),
  batteryStyle: PropTypes.object,
  drone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    mode: PropTypes.string,
    gpsFix: PropTypes.string,
    satellites: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    battery: PropTypes.string,
    batteryPercentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    heading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ahl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amsl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    agl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currentPosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      z: PropTypes.number,
    }),
  }),
  gpsFixType: PropTypes.number,
  linked: PropTypes.bool,
  mode: PropTypes.string,
  pathUploaded: PropTypes.bool,
  statusLabel: PropTypes.string,
  statusStyle: PropTypes.object,
};

export default connect((state, { drone }) => {
  const uavId = drone?.id != null ? String(drone.id) : null;
  const uav = uavId ? getUAVById(state, uavId) : undefined;

  if (!uav) {
    return {
      drone,
      linked: false,
      statusLabel: drone?.status,
      statusStyle: pillStyleFromSemantics(SemanticStatus.OFF),
    };
  }

  const summary = getSingleUAVStatusSummary(uav);
  const uploadStatus = getUploadStatusCodeMapping(state)[uavId];
  const batteryFormatter = getBatteryFormatter(state);
  const pathUploadContext = { externalShowUploaded: isExternalShowUploaded(state) };
  const batteryStatus = uav.battery;
  const batteryPercentage = resolveBatteryPercentage(
    batteryStatus?.percentage,
    batteryStatus?.voltage,
    batteryFormatter.estimatePercentageFromVoltage,
    batteryStatus?.cellCount
  );

  return {
    drone,
    linked: true,
    alert: getUavAlert(uav, {
      ...pathUploadContext,
      uploadStatus,
      batteryPercentage: resolveUavAlertBatteryPercentage({
        cellCount: batteryStatus?.cellCount,
        percentage: batteryStatus?.percentage,
        voltage: batteryStatus?.voltage,
        estimatePercentageFromVoltage: batteryFormatter.estimatePercentageFromVoltage,
      }),
      geofenceRequired: isShowOutdoor(state),
      geofenceSet: hasActiveGeofencePolygon(state),
      showStartTimeSet: hasScheduledStartTime(state),
    }),
    batteryStyle: getBatteryLevelStyle(batteryPercentage),
    gpsFixType: uav.gpsFix?.type,
    mode: uav.mode,
    pathUploaded: isPathUploadedForUav(uav, uploadStatus, pathUploadContext),
    statusLabel: summary.details || summary.text,
    statusStyle:
      summary.vehicleModePillStyle ?? pillStyleFromSemantics(summary.textSemantics),
  };
})(DroneStatusOverlayPresentation);
