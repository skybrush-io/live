import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export default function DroneInfoPanel({ open, drone, onClose }) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [z, setZ] = useState('');
  const draggingPathIndexRef = useRef(null);
  const [dragOverPathIndex, setDragOverPathIndex] = useState(null);
  const [pathPoints, setPathPoints] = useState([
    { x: '', y: '', z: '', durationMs: '1000' },
  ]);

  // 드론 바뀔 때 입력칸 및 경로 초기화 / JSON에서 path가 오면 반영
  useEffect(() => {
    setX('');
    setY('');
    setZ('');

    if (drone && Array.isArray(drone.path) && drone.path.length) {
      setPathPoints(
        drone.path.map((p) => ({
          x: String(p.x ?? ''),
          y: String(p.y ?? ''),
          z: String(p.z ?? ''),
          durationMs: String(p.durationMs ?? '1000'),
        }))
      );
    } else {
      setPathPoints([{ x: '', y: '', z: '', durationMs: '1000' }]);
    }
  }, [drone?.id, drone?.path]);

  const canMove = useMemo(() => {
    const nx = Number(x), ny = Number(y), nz = Number(z);
    return !!drone?.id && Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz);
  }, [drone?.id, x, y, z]);

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
        durationMs: Number(p.durationMs),
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
                  onDragOver={(e) => handlePathDragOver(e, idx)}
                  onDrop={() => handlePathDrop(idx)}
                  onDragEnter={(e) => handlePathDragOver(e, idx)}
                  onDragEnd={handlePathDragEnd}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 24px 1fr 1fr 1fr 72px',
                    gap: 6,
                    alignItems: 'center',
                    marginBottom: 6,
                    fontSize: 12,
                    borderRadius: 6,
                    padding: '2px 4px',
                    border:
                      dragOverPathIndex === idx
                        ? '1px dashed rgba(255,255,255,0.45)'
                        : '1px dashed transparent',
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
            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.5 }}>
              경로 점 행을 드래그해서 순서를 변경할 수 있습니다.
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