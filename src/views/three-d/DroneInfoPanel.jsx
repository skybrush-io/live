import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

export default function DroneInfoPanel({ open, drone, onClose }) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');

  // 드론 바뀔 때 입력칸 초기값(원하면 여기서 드론 현재 position을 넣어도 됨)
  useEffect(() => {
    setX('');
    setY('');
    setZ('');
  }, [drone?.id]);

  const canMove = useMemo(() => {
    const nx = Number(x), ny = Number(y), nz = Number(z);
    return drone?.id && Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
  }, [drone?.id, x, y, z]);

  const requestMove = () => {
    if (!canMove) return;

    window.dispatchEvent(
      new CustomEvent('drone-move-request', {
        detail: {
          id: drone.id,
          x: Number(x),
          y: Number(y),
          z: Number(z),
        },
      })
    );
  };

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

      <div style={{ marginTop: 16 }}>
        {!drone ? (
          <div style={{ opacity: 0.5 }}>드론을 선택하세요.</div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>ID</div>
              <div style={{ fontSize: 16 }}>{drone.id}</div>
            </div>

            <div style={{ marginTop: 18, fontWeight: 700 }}>Move to (x, y, z)</div>

            <InputRow label="x" value={x} onChange={setX} />
            <InputRow label="y" value={y} onChange={setY} />
            <InputRow label="z" value={z} onChange={setZ} />

            <button
              disabled={!canMove}
              onClick={requestMove}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.25)',
                background: canMove ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                color: 'white',
                cursor: canMove ? 'pointer' : 'not-allowed',
              }}
            >
              이동
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
              입력값은 ThreeDView 로컬 좌표계 기준입니다.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InputRow({ label, value, onChange }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="number"
        style={{
          width: '100%',
          marginTop: 6,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.25)',
          color: 'white',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

DroneInfoPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  drone: PropTypes.shape({
    id: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};