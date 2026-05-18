import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const displayValue = (value, suffix = '') => {
  const text = String(value ?? '').trim();
  return text ? `${text}${suffix}` : '-';
};

export const buildDroneTelemetryItems = (drone) => {
  const statusText = displayValue(drone?.status);

  return [
    { label: 'Status', value: statusText, highlight: true },
    { label: 'Mode', value: displayValue(drone?.mode) },
    { label: 'GPS', value: displayValue(drone?.gpsFix) },
    { label: 'Sats', value: displayValue(drone?.satellites) },
    { label: 'Battery', value: displayValue(drone?.battery) },
    { label: 'Battery %', value: displayValue(drone?.batteryPercentage, '%') },
    { label: 'Heading', value: displayValue(drone?.heading, '°') },
    { label: 'AHL', value: displayValue(drone?.ahl, ' m') },
    { label: 'AMSL', value: displayValue(drone?.amsl, ' m') },
    { label: 'AGL', value: displayValue(drone?.agl, ' m') },
  ];
};

const DroneStatusOverlay = ({ drone }) => {
  const telemetryItems = useMemo(() => buildDroneTelemetryItems(drone), [drone]);

  const currentPositionText = useMemo(() => {
    const pos = drone?.currentPosition;
    if (!pos) return null;
    const px = Number(pos.x);
    const py = Number(pos.y);
    const pz = Number(pos.z);
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) return null;
    return `${px.toFixed(3)}, ${py.toFixed(3)}, ${pz.toFixed(3)}`;
  }, [drone?.currentPosition]);

  if (!drone?.id) return null;

  const statusItem = telemetryItems.find((item) => item.highlight);
  const detailItems = telemetryItems.filter((item) => !item.highlight);

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 10001,
        width: 320,
        maxWidth: 'min(320px, calc(100vw - 28px))',
        borderRadius: 14,
        border: '1px solid rgba(126, 200, 255, 0.28)',
        background: 'linear-gradient(165deg, rgba(18,24,36,0.94), rgba(11,15,24,0.92))',
        color: '#edf5ff',
        padding: '12px 14px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, opacity: 0.62 }}>드론 상태</div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{drone.id}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.9, whiteSpace: 'nowrap' }}>
          <div>{displayValue(drone?.battery)}</div>
          <div>{displayValue(drone?.heading, '°')}</div>
        </div>
      </div>

      {statusItem && (
        <div
          style={{
            marginBottom: 10,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(0, 200, 83, 0.9)',
            color: '#111827',
            fontWeight: 700,
            fontSize: 13,
            textAlign: 'center',
            letterSpacing: 0.4,
          }}
        >
          {String(statusItem.value).toUpperCase()}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {detailItems.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 10, opacity: 0.62 }}>{item.label}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {currentPositionText && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 8px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.62 }}>Position (x, y, z)</div>
          <div style={{ fontSize: 12 }}>{currentPositionText}</div>
        </div>
      )}
    </div>
  );
};

DroneStatusOverlay.propTypes = {
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
};

export default DroneStatusOverlay;
