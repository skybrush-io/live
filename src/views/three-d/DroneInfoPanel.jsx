// DroneInfoPanel.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function DroneInfoPanel({ open, drone, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: 340,
        background: 'rgba(20,20,20,0.95)',
        color: 'white',
        padding: 16,
        boxSizing: 'border-box',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease',
        zIndex: 10000,
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        overflowY: 'auto',
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Drone Info</div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>

      {/* 내용 */}
      <div style={{ marginTop: 20 }}>
        {!drone ? (
          <div style={{ opacity: 0.5 }}>드론을 선택하세요.</div>
        ) : (
          <>
            <InfoRow label="ID" value={drone.id} />
            <InfoRow label="Name" value={drone.name} />
            <InfoRow label="Battery" value={`${drone.battery}%`} />
            <InfoRow label="Status" value={drone.status} />
          </>
        )}
      </div>
    </div>
  );
}

/* 작은 정보 라인 컴포넌트 */
function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: 16 }}>{value}</div>
    </div>
  );
}

DroneInfoPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  drone: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};