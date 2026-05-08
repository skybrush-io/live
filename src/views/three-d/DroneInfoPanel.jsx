import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function DroneInfoPanel({ open, drone, onClose }) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');
  const draggingPathIndexRef = useRef(null);
  const [dragOverPathIndex, setDragOverPathIndex] = useState(null);
  const [pathPoints, setPathPoints] = useState([
    { x: '', y: '', z: '', durationMs: '1000', holdMs: '0' },
  ]);

  // 드론 바뀔 때 입력칸 및 경로 초기화 / JSON에서 path가 오면 반영
  useEffect(() => {
    const initial = drone?.initialPosition;
    if (initial) {
      setX(String(initial.x ?? ''));
      setY(String(initial.y ?? ''));
      setZ(String(initial.z ?? ''));
    } else {
      setX('');
      setY('');
      setZ('');
    }

    if (drone && Array.isArray(drone.path) && drone.path.length) {
      setPathPoints(
        drone.path.map((p) => ({
          x: String(p.x ?? ''),
          y: String(p.y ?? ''),
          z: String(p.z ?? ''),
          durationMs: String(p.durationMs ?? '1000'),
          holdMs: String(p.holdMs ?? '0'),
        }))
      );
    } else {
      setPathPoints([{ x: '', y: '', z: '', durationMs: '1000', holdMs: '0' }]);
    }
  }, [drone?.id, drone?.path]);

  const canSetInitialPositionFromInputs = useMemo(() => {
    const nx = Number(x), ny = Number(y), nz = Number(z);
    return !!drone?.id && Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
  }, [drone?.id, x, y, z]);

  const canSetInitialPositionFromCurrent = useMemo(() => {
    const pos = drone?.currentPosition;
    if (!drone?.id || !pos) return false;
    const nx = Number(pos.x);
    const ny = Number(pos.y);
    const nz = Number(pos.z);
    return Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
  }, [drone?.id, drone?.currentPosition]);

  const canPlayPath = useMemo(() => {
    if (!drone?.id) return false;

    return pathPoints.some((p) => {
      const hasAll =
        p.x !== undefined &&
        p.y !== undefined &&
        p.z !== undefined &&
        String(p.x).trim() !== '' &&
        String(p.y).trim() !== '' &&
        String(p.z).trim() !== '';

      if (!hasAll) return false;

      const nx = Number(p.x);
      const ny = Number(p.y);
      const nz = Number(p.z);

      return Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
    });
  }, [drone?.id, pathPoints]);

  const requestSetInitialPosition = () => {
    if (!canSetInitialPositionFromInputs) return;

    window.dispatchEvent(
      new CustomEvent('drone-initial-pos-set', {
        detail: {
          id: drone.id,
          x: Number(x),
          y: Number(y),
          z: Number(z),
        },
      })
    );
  };

  const requestSetInitialPositionFromCurrent = () => {
    if (!canSetInitialPositionFromCurrent) return;
    const pos = drone.currentPosition;
    window.dispatchEvent(
      new CustomEvent('drone-initial-pos-set', {
        detail: {
          id: drone.id,
          x: Number(pos.x),
          y: Number(pos.y),
          z: Number(pos.z),
        },
      })
    );
  };

  const updatePathPoint = (index, key, value) => {
    setPathPoints((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const addPathPoint = () => {
    setPathPoints((prev) => [...prev, { x: '', y: '', z: '', durationMs: '1000', holdMs: '0' }]);
  };

  const addCurrentPositionPathPoint = () => {
    if (!drone?.id || typeof document === 'undefined') return;

    const safeId =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(drone.id)
        : drone.id;
    const target = document.querySelector(`a-scene [data-drone-id="${safeId}"]`);
    const pos = target?.getAttribute?.('position');
    if (!pos || typeof pos !== 'object') return;

    const nx = Number(pos.x);
    const ny = Number(pos.y);
    const nz = Number(pos.z);
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return;

    const formatCoord = (value) => String(Math.round(value * 1000) / 1000);
    const nextPoint = {
      x: formatCoord(nx),
      y: formatCoord(ny),
      z: formatCoord(nz),
      durationMs: '1000',
      holdMs: '0',
    };

    setPathPoints((prev) => [
      // 기본 빈 1행만 있는 경우에는 교체하고, 아니면 맨 뒤에 추가
      ...(Array.isArray(prev) &&
      prev.length === 1 &&
      String(prev[0]?.x ?? '').trim() === '' &&
      String(prev[0]?.y ?? '').trim() === '' &&
      String(prev[0]?.z ?? '').trim() === ''
        ? [nextPoint]
        : [...(Array.isArray(prev) ? prev : []), nextPoint]),
    ]);
  };

  const removePathPoint = (index) => {
    setPathPoints((prev) => {
      if (!Array.isArray(prev) || !prev.length) {
        return [{ x: '', y: '', z: '', durationMs: '1000', holdMs: '0' }];
      }

      const next = prev.filter((_, i) => i !== index);
      if (!next.length) {
        return [{ x: '', y: '', z: '', durationMs: '1000', holdMs: '0' }];
      }
      return next;
    });
  };

  const movePathPoint = (fromIndex, toIndex) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= pathPoints.length ||
      toIndex >= pathPoints.length
    ) {
      return;
    }

    setPathPoints((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handlePathDragStart = (event, index) => {
    draggingPathIndexRef.current = index;
    event.dataTransfer.effectAllowed = 'move';
    // 일부 브라우저에서 드래그 시작 인식을 위해 데이터 설정이 필요함
    event.dataTransfer.setData('text/plain', String(index));
    setDragOverPathIndex(index);
  };

  const handlePathDragOver = (event, index) => {
    event.preventDefault();
    setDragOverPathIndex(index);
  };

  const handlePathDrop = (index) => {
    if (draggingPathIndexRef.current === null) return;
    movePathPoint(draggingPathIndexRef.current, index);
    draggingPathIndexRef.current = null;
    setDragOverPathIndex(null);
  };

  const handlePathDragEnd = () => {
    draggingPathIndexRef.current = null;
    setDragOverPathIndex(null);
  };

  const requestPath = () => {
    if (!drone?.id) return;

    const points = pathPoints
      .filter((p) => {
        if (
          p.x === undefined ||
          p.y === undefined ||
          p.z === undefined ||
          String(p.x).trim() === '' ||
          String(p.y).trim() === '' ||
          String(p.z).trim() === ''
        ) {
          return false;
        }

        const nx = Number(p.x);
        const ny = Number(p.y);
        const nz = Number(p.z);

        return Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
      })
      .map((p) => ({
        x: Number(p.x),
        y: Number(p.y),
        z: Number(p.z),
        durationMs: Number.isFinite(Number(p.durationMs)) && Number(p.durationMs) >= 0
          ? Number(p.durationMs)
          : 1000,
        holdMs: Number.isFinite(Number(p.holdMs)) && Number(p.holdMs) >= 0
          ? Number(p.holdMs)
          : 0,
      }));

    if (!points.length) return;

    window.dispatchEvent(
      new CustomEvent('drone-path-request', {
        detail: {
          id: drone.id,
          points,
          durationPerSegment: 1000,
          startFromInitial: true,
        },
      })
    );

    // JSON 저장용으로 현재 경로를 ThreeDView에 알려줌
    window.dispatchEvent(
      new CustomEvent('drone-path-updated', {
        detail: {
          id: drone.id,
          path: points,
        },
      })
    );
  };

  const currentPositionText = useMemo(() => {
    const pos = drone?.currentPosition;
    if (!pos) return '-';
    const x = Number(pos.x);
    const y = Number(pos.y);
    const z = Number(pos.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return '-';
    return `${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)}`;
  }, [drone?.currentPosition]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        right: 0,
        width: 420,
        maxWidth: 'min(420px, 92vw)',
        height: 'calc(100% - 28px)',
        background: 'linear-gradient(170deg, rgba(18,24,36,0.95), rgba(11,15,24,0.93))',
        color: '#edf5ff',
        padding: 16,
        boxSizing: 'border-box',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease',
        zIndex: 10000,
        borderLeft: '1px solid rgba(126, 200, 255, 0.25)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Drone Info</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 1 }}>선택 드론 상세 제어</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#f2f8ff',
            borderRadius: 8,
            padding: '5px 9px',
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
            <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, opacity: 0.62 }}>ID</div>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>{drone.id}</div>
            </div>
            <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, opacity: 0.62 }}>Current Position (x, y, z)</div>
              <div style={{ fontSize: 13.5 }}>{currentPositionText}</div>
            </div>

            {/* Initial Position */}
            <div style={{ marginTop: 18, fontWeight: 700, marginBottom: 8 }}>
              Initial Position (x, y, z)
            </div>

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
                  <div style={{ fontSize: 11.5, opacity: 0.62 }}>{label}</div>
                  <input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={label}
                    inputMode="decimal"
                    style={{
                      marginTop: 4,
                      padding: '8px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(130,190,255,0.24)',
                      background: 'rgba(248,252,255,0.07)',
                      color: '#edf5ff',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              disabled={!canSetInitialPositionFromCurrent}
              onClick={requestSetInitialPositionFromCurrent}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.24)',
                background: canSetInitialPositionFromCurrent
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(255,255,255,0.07)',
                color: '#f3f8ff',
                cursor: canSetInitialPositionFromCurrent ? 'pointer' : 'not-allowed',
              }}
            >
              현재 위치를 초기 위치로 설정
            </button>
            <button
              disabled={!canSetInitialPositionFromInputs}
              onClick={requestSetInitialPosition}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: canSetInitialPositionFromInputs
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(255,255,255,0.05)',
                color: 'rgba(243,248,255,0.9)',
                cursor: canSetInitialPositionFromInputs ? 'pointer' : 'not-allowed',
                fontSize: 12,
              }}
            >
              입력값으로 초기 위치 설정
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
                  onDragOver={(e) => handlePathDragOver(e, idx)}
                  onDrop={() => handlePathDrop(idx)}
                  onDragEnter={(e) => handlePathDragOver(e, idx)}
                  onDragEnd={handlePathDragEnd}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 24px 1fr 1fr 1fr 72px 72px 28px',
                    gap: 6,
                    alignItems: 'center',
                    marginBottom: 6,
                    fontSize: 12,
                    borderRadius: 6,
                    padding: '2px 4px',
                    border:
                      dragOverPathIndex === idx
                        ? '1px dashed rgba(178,221,255,0.74)'
                        : '1px dashed transparent',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    draggable
                    onDragStart={(e) => handlePathDragStart(e, idx)}
                    style={{
                      textAlign: 'center',
                      opacity: 0.7,
                      cursor: 'grab',
                      userSelect: 'none',
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    title="드래그해서 순서 변경"
                  >
                    ≡
                  </div>
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
                    placeholder="이동ms"
                    title="이 지점까지 이동하는 시간(ms)"
                    inputMode="numeric"
                    style={{
                      ...smallInputStyle,
                      fontSize: 11,
                    }}
                  />
                  <input
                    value={p.holdMs}
                    onChange={(e) => updatePathPoint(idx, 'holdMs', e.target.value)}
                    placeholder="대기ms"
                    title="이 지점 도착 후 머무는 시간(ms)"
                    inputMode="numeric"
                    style={{
                      ...smallInputStyle,
                      fontSize: 11,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removePathPoint(idx)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: '1px solid rgba(255,80,80,0.45)',
                      background: 'rgba(255,60,60,0.12)',
                      color: '#ff9b9b',
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      padding: 0,
                    }}
                    title="이 점 삭제"
                  >
                    -
                  </button>
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
                  onClick={addCurrentPositionPathPoint}
                  style={secondaryBtnStyle}
                >
                  현재 위치 점 추가
                </button>

                <button
                  type="button"
                  disabled={!canPlayPath}
                  onClick={requestPath}
                  style={{
                    ...secondaryBtnStyle,
                    background: canPlayPath
                      ? 'rgba(255,255,255,0.14)'
                      : 'rgba(255,255,255,0.07)',
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
            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.5 }}>
              경로 점 행을 드래그해서 순서를 변경할 수 있습니다.
            </div>
          </>
        )}

        {/* 드론 삭제 */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (!drone?.id) return;
              window.dispatchEvent(
                new CustomEvent('drone-delete-request', { detail: { id: drone.id } })
              );
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,80,80,0.45)',
              background: 'rgba(255,60,60,0.12)',
              color: '#ff8080',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            이 드론 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

const smallInputStyle = {
  padding: '7px 8px',
  borderRadius: 8,
  border: '1px solid rgba(130,190,255,0.24)',
  background: 'rgba(248,252,255,0.07)',
  color: '#ecf5ff',
  fontSize: 12,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

const secondaryBtnStyle = {
  flex: 1,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.09)',
  color: '#f1f7ff',
  cursor: 'pointer',
  fontSize: 12.5,
};

DroneInfoPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  drone: PropTypes.shape({
    id: PropTypes.string,
    currentPosition: PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      z: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    initialPosition: PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      z: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
  onClose: PropTypes.func.isRequired,
};