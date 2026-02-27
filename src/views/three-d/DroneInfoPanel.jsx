import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

export default function DroneInfoPanel({ open, drone, onClose }) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');
  const [pathPoints, setPathPoints] = useState([
    { x: '', y: '', z: '', durationMs: '1000' },
  ]);

  // 드론 바뀔 때 입력칸 초기화
  useEffect(() => {
    setX('');
    setY('');
    setZ('');
    setPathPoints([{ x: '', y: '', z: '', durationMs: '1000' }]);
  }, [drone?.id]);

  const canMove = useMemo(() => {
    const nx = Number(x), ny = Number(y), nz = Number(z);
    return !!drone?.id && Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
  }, [drone?.id, x, y, z]);

  const canPlayPath = useMemo(() => {
    if (!drone?.id) return false;
    const parsed = pathPoints.map((p) => ({
      x: Number(p.x),
      y: Number(p.y),
      z: Number(p.z),
    }));
    return parsed.some((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
  }, [drone?.id, pathPoints]);

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

  const updatePathPoint = (index, key, value) => {
    setPathPoints((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const addPathPoint = () => {
    setPathPoints((prev) => [...prev, { x: '', y: '', z: '', durationMs: '1000' }]);
  };

  const requestPath = () => {
    if (!drone?.id) return;

    const points = pathPoints
      .map((p) => ({
        x: Number(p.x),
        y: Number(p.y),
        z: Number(p.z),
        durationMs: Number(p.durationMs),
      }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));

    if (!points.length) return;

    window.dispatchEvent(
      new CustomEvent('drone-path-request', {
        detail: {
          id: drone.id,
          points,
          durationPerSegment: 1000,
        },
      })
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 0,
        width: 430,
        maxWidth: 'min(430px, 92vw)',
        height: 'calc(100% - 24px)',
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
      {/* Header */}
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
            {/* ID */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>ID</div>
              <div style={{ fontSize: 16 }}>{drone.id}</div>
            </div>

            {/* Move */}
            <div style={{ marginTop: 18, fontWeight: 700, marginBottom: 8 }}>
              Move to (x, y, z)
            </div>

            {/* ✅ FIX: X/Y/Z가 한 줄에 다 보이도록 3열 그리드로 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {[
                { label: 'X', value: x, setter: setX },
                { label: 'Y', value: y, setter: setY },
                { label: 'Z', value: z, setter: setZ },
              ].map(({ label, value, setter }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
                  <input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={label}
                    inputMode="decimal"
                    style={{
                      marginTop: 4,
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'white',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

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

            {/* Path */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Path (애니메이션)</div>

              {pathPoints.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 1fr 1fr 72px',
                    gap: 6,
                    alignItems: 'center',
                    marginBottom: 6,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.6, textAlign: 'center' }}>
                    {idx + 1}
                  </div>

                  <input
                    value={p.x}
                    onChange={(e) => updatePathPoint(idx, 'x', e.target.value)}
                    placeholder="X"
                    inputMode="decimal"
                    style={smallInputStyle}
                  />
                  <input
                    value={p.y}
                    onChange={(e) => updatePathPoint(idx, 'y', e.target.value)}
                    placeholder="Y"
                    inputMode="decimal"
                    style={smallInputStyle}
                  />
                  <input
                    value={p.z}
                    onChange={(e) => updatePathPoint(idx, 'z', e.target.value)}
                    placeholder="Z"
                    inputMode="decimal"
                    style={smallInputStyle}
                  />
                  <input
                    value={p.durationMs}
                    onChange={(e) => updatePathPoint(idx, 'durationMs', e.target.value)}
                    placeholder="ms"
                    inputMode="numeric"
                    style={{
                      ...smallInputStyle,
                      fontSize: 11,
                    }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', marginTop: 8, gap: 8 }}>
                <button
                  type="button"
                  onClick={addPathPoint}
                  style={secondaryBtnStyle}
                >
                  점 추가
                </button>

                <button
                  type="button"
                  disabled={!canPlayPath}
                  onClick={requestPath}
                  style={{
                    ...secondaryBtnStyle,
                    background: canPlayPath
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(255,255,255,0.06)',
                    cursor: canPlayPath ? 'pointer' : 'not-allowed',
                    opacity: canPlayPath ? 1 : 0.8,
                  }}
                >
                  경로 재생
                </button>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
              입력값은 ThreeDView 로컬 좌표계 기준입니다.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const smallInputStyle = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(0,0,0,0.25)',
  color: 'white',
  fontSize: 12,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const secondaryBtnStyle = {
  flex: 1,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  cursor: 'pointer',
  fontSize: 13,
};

DroneInfoPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  drone: PropTypes.shape({
    id: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};