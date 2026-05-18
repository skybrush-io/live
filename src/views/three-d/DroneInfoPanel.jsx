import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// 첫 번째 항목 ''은 "백엔드 기본값(.skyc 다운로드) 사용". payload에서 output 키를 생략.
const FORMATION_OUTPUT_OPTIONS = [
  { value: '', label: '(기본값) skyc 다운로드' },
  { value: 'path', label: 'path (디버그 JSON)' },
  { value: 'show', label: 'show' },
  { value: 'skyc', label: 'skyc (명시)' },
];

export default function DroneInfoPanel({
  open,
  drone,
  onClose,
  droneCount = 0,
  formationPhases = [],
  formationSettings = null,
  isSendingFormation = false,
  formationDeliveryStatus = '',
  onAddFormationPhase = () => {},
  onRemoveFormationPhase = () => {},
  onMoveFormationPhase = () => {},
  onUpdateFormationPhaseMeta = () => {},
  onUpdateFormationDronePosition = () => {},
  onCaptureDronePositionInPhase = () => {},
  onCaptureAllPositionsInPhase = () => {},
  onApplyDronePositionInPhase = () => {},
  onApplyAllDronesInPhase = () => {},
  onUpdateFormationSettings = () => {},
  onSendFormationPlan = () => {},
}) {
  const [activeTab, setActiveTab] = useState('path');
  const draggingPathIndexRef = useRef(null);
  const [dragOverPathIndex, setDragOverPathIndex] = useState(null);
  const [pathPoints, setPathPoints] = useState([
    { x: '', y: '', z: '', durationMs: '1000', holdMs: '0' },
  ]);
  const [initialFields, setInitialFields] = useState({ ix: '', iy: '', iz: '' });

  // 드론 바뀔 때 경로 초기화 / JSON에서 path가 오면 반영
  useEffect(() => {
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

  const initialPositionSyncKey = useMemo(() => {
    const ip = drone?.initialPosition;
    if (!ip) return '';
    const a = Number(ip.x);
    const b = Number(ip.y);
    const c = Number(ip.z);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return '';
    return `${a},${b},${c}`;
  }, [drone?.initialPosition]);

  useEffect(() => {
    if (!drone?.id) return;
    const ip = drone.initialPosition;
    if (
      ip &&
      Number.isFinite(Number(ip.x)) &&
      Number.isFinite(Number(ip.y)) &&
      Number.isFinite(Number(ip.z))
    ) {
      setInitialFields({
        ix: String(ip.x),
        iy: String(ip.y),
        iz: String(ip.z),
      });
      return;
    }
    const cp = drone.currentPosition;
    if (
      cp &&
      Number.isFinite(Number(cp.x)) &&
      Number.isFinite(Number(cp.y)) &&
      Number.isFinite(Number(cp.z))
    ) {
      setInitialFields({
        ix: String(cp.x),
        iy: String(cp.y),
        iz: String(cp.z),
      });
      return;
    }
    setInitialFields({ ix: '0', iy: '1', iz: '1' });
  }, [drone?.id, initialPositionSyncKey]);

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

  const fillInitialFromCurrentPosition = () => {
    const pos = drone?.currentPosition;
    if (!pos) return;
    const px = Number(pos.x);
    const py = Number(pos.y);
    const pz = Number(pos.z);
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) return;
    setInitialFields({
      ix: String(Math.round(px * 1000) / 1000),
      iy: String(Math.round(py * 1000) / 1000),
      iz: String(Math.round(pz * 1000) / 1000),
    });
  };

  const applyInitialPosition = ({ moveDrone } = { moveDrone: false }) => {
    if (!drone?.id) return;
    const nx = Number(initialFields.ix);
    const ny = Number(initialFields.iy);
    const nz = Number(initialFields.iz);
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return;

    window.dispatchEvent(
      new CustomEvent('drone-initial-pos-set', {
        detail: { id: drone.id, x: nx, y: ny, z: nz },
      })
    );

    if (moveDrone) {
      window.dispatchEvent(
        new CustomEvent('drone-move-request', {
          detail: { id: drone.id, x: nx, y: ny, z: nz },
        })
      );
    }
  };

  const safeFormationSettings = formationSettings || {
    step_size: 1,
    duration_ms: 1000,
    takeoff_time: 0,
    auto_upload: false,
    output: '',
  };

  const renderPathTab = () => (
    <>
      <div style={{ marginTop: 4 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Path (애니메이션)</div>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8, lineHeight: 1.4 }}>
          첫 번째 점(#1)이 곧 시작 위치입니다. <b>경로 재생</b>을 누르면 #1로 즉시
          스냅한 뒤 #2부터 애니메이션됩니다.
        </div>

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
  );

  const renderFormationTab = () => {
    const droneId = drone?.id;
    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
            marginBottom: 6,
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>Formation Phases</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
              현재 드론 {droneCount}대 · phase {formationPhases.length}개
            </div>
          </div>
          <button
            type="button"
            onClick={onAddFormationPhase}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(120, 220, 175, 0.5)',
              background: 'rgba(36, 132, 91, 0.32)',
              color: '#dffce8',
              cursor: 'pointer',
              fontSize: 11.5,
              fontWeight: 600,
            }}
            title="현재 모든 드론의 위치를 새 phase로 캡처"
          >
            + Phase (현재 위치)
          </button>
        </div>

        <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 8, lineHeight: 1.4 }}>
          3D 뷰에서 드론을 움직여 모양을 만든 뒤
          <br />
          <b>+ Phase</b> 버튼으로 그 순간의 위치를 phase로 저장하세요.
          <br />
          phase 데이터는 모든 드론이 공유합니다.
        </div>

        {formationPhases.length === 0 ? (
          <div
            style={{
              padding: '14px 12px',
              borderRadius: 10,
              border: '1px dashed rgba(180,220,255,0.25)',
              background: 'rgba(255,255,255,0.03)',
              textAlign: 'center',
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            아직 phase가 없습니다.
            <br />
            드론들을 원하는 위치로 옮기고 <b>+ Phase</b>를 눌러주세요.
          </div>
        ) : (
          formationPhases.map((phase, idx) => {
            const captured = phase.points?.[droneId];
            const hasCaptured = !!captured;
            const px = captured?.x;
            const py = captured?.y;
            const pz = captured?.z;
            return (
              <div
                key={phase.id}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(126, 200, 255, 0.22)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 90px',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      opacity: 0.8,
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <input
                    value={phase.name ?? ''}
                    onChange={(e) =>
                      onUpdateFormationPhaseMeta(phase.id, { name: e.target.value })
                    }
                    placeholder="phase 이름 (예: heart)"
                    style={smallInputStyle}
                  />
                  <input
                    value={phase.holdMs ?? 0}
                    onChange={(e) =>
                      onUpdateFormationPhaseMeta(phase.id, {
                        holdMs: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="holdMs"
                    title="이 phase 완성 후 머무는 시간(ms)"
                    inputMode="numeric"
                    style={smallInputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onMoveFormationPhase(phase.id, 'up')}
                    disabled={idx === 0}
                    style={{
                      ...phaseIconBtnStyle,
                      opacity: idx === 0 ? 0.4 : 1,
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    }}
                    title="위로 이동"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveFormationPhase(phase.id, 'down')}
                    disabled={idx === formationPhases.length - 1}
                    style={{
                      ...phaseIconBtnStyle,
                      opacity: idx === formationPhases.length - 1 ? 0.4 : 1,
                      cursor:
                        idx === formationPhases.length - 1 ? 'not-allowed' : 'pointer',
                    }}
                    title="아래로 이동"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onCaptureAllPositionsInPhase(phase.id)}
                    style={{
                      ...phaseSmallBtnStyle,
                      flex: 1,
                    }}
                    title="이 phase에 모든 드론의 현재 위치를 다시 캡처"
                  >
                    모두 재캡처
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFormationPhase(phase.id)}
                    style={{
                      ...phaseSmallBtnStyle,
                      border: '1px solid rgba(255,80,80,0.45)',
                      background: 'rgba(255,60,60,0.12)',
                      color: '#ffb1b1',
                    }}
                    title="이 phase 삭제"
                  >
                    삭제
                  </button>
                </div>

                <button
                  type="button"
                  disabled={droneCount === 0}
                  onClick={() => onApplyAllDronesInPhase(phase.id)}
                  style={{
                    marginTop: 6,
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(160, 200, 255, 0.45)',
                    background:
                      droneCount === 0
                        ? 'rgba(60, 80, 100, 0.35)'
                        : 'rgba(40, 90, 150, 0.38)',
                    color: '#e8f4ff',
                    cursor: droneCount === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                  title="이 phase에 저장된 좌표로 등록된 모든 드론 이동 (미캡처 드론은 초기 위치)"
                >
                  모든 드론 이 phase로 이동
                </button>

                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px dashed rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                      marginBottom: 5,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>이 드론({droneId || '-'}) 위치</span>
                    <span style={{ opacity: hasCaptured ? 0.8 : 0.45 }}>
                      {hasCaptured ? '캡처됨' : '미캡처 → 초기 위치 사용'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 5,
                    }}
                  >
                    {[
                      { label: 'X', key: 'x', value: px },
                      { label: 'Y', key: 'y', value: py },
                      { label: 'Z', key: 'z', value: pz },
                    ].map(({ label, key, value }) => (
                      <input
                        key={label}
                        value={value === undefined || value === null ? '' : value}
                        placeholder={label}
                        inputMode="decimal"
                        disabled={!droneId}
                        onChange={(e) => {
                          if (!droneId) return;
                          const raw = e.target.value;
                          if (raw === '' && !hasCaptured) return;

                          const next = {
                            x: Number(captured?.x ?? 0),
                            y: Number(captured?.y ?? 0),
                            z: Number(captured?.z ?? 0),
                          };
                          if (raw === '') {
                            next[key] = 0;
                          } else {
                            const parsed = Number(raw);
                            if (!Number.isFinite(parsed)) return;
                            next[key] = parsed;
                          }
                          onUpdateFormationDronePosition(phase.id, droneId, next);
                        }}
                        style={smallInputStyle}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                    <button
                      type="button"
                      disabled={!droneId}
                      onClick={() => droneId && onCaptureDronePositionInPhase(phase.id, droneId)}
                      style={{
                        ...phaseSmallBtnStyle,
                        flex: 1,
                        opacity: droneId ? 1 : 0.5,
                        cursor: droneId ? 'pointer' : 'not-allowed',
                      }}
                      title="현재 3D 위치를 이 phase에 캡처"
                    >
                      현재 위치 캡처
                    </button>
                    <button
                      type="button"
                      disabled={!droneId || !hasCaptured}
                      onClick={() => droneId && onApplyDronePositionInPhase(phase.id, droneId)}
                      style={{
                        ...phaseSmallBtnStyle,
                        flex: 1,
                        opacity: droneId && hasCaptured ? 1 : 0.5,
                        cursor: droneId && hasCaptured ? 'pointer' : 'not-allowed',
                      }}
                      title="이 phase의 위치로 드론을 이동"
                    >
                      이 위치로 이동
                    </button>
                    <button
                      type="button"
                      disabled={!droneId || !hasCaptured}
                      onClick={() => droneId && onUpdateFormationDronePosition(phase.id, droneId, null)}
                      style={{
                        ...phaseSmallBtnStyle,
                        opacity: droneId && hasCaptured ? 1 : 0.5,
                        cursor: droneId && hasCaptured ? 'pointer' : 'not-allowed',
                      }}
                      title="이 드론의 캡처된 위치를 제거 (초기 위치로 fallback)"
                    >
                      해제
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Global formation settings */}
        <div
          style={{
            marginTop: 18,
            padding: 10,
            borderRadius: 10,
            border: '1px solid rgba(126, 200, 255, 0.22)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>
            전송 옵션
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 6,
            }}
          >
            <div>
              <div style={settingLabelStyle}>step_size</div>
              <input
                value={safeFormationSettings.step_size}
                onChange={(e) =>
                  onUpdateFormationSettings({
                    step_size: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
                inputMode="decimal"
                placeholder="1.0"
                style={smallInputStyle}
              />
            </div>
            <div>
              <div style={settingLabelStyle}>duration_ms</div>
              <input
                value={safeFormationSettings.duration_ms}
                onChange={(e) =>
                  onUpdateFormationSettings({
                    duration_ms: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
                inputMode="numeric"
                placeholder="1000"
                style={smallInputStyle}
              />
            </div>
            <div>
              <div style={settingLabelStyle}>takeoff_time</div>
              <input
                value={safeFormationSettings.takeoff_time}
                onChange={(e) =>
                  onUpdateFormationSettings({
                    takeoff_time: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
                inputMode="numeric"
                placeholder="0 = 생략"
                title="0이면 페이로드에 포함되지 않습니다 (옵션값)"
                style={smallInputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
              alignItems: 'center',
            }}
          >
            <label
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={!!safeFormationSettings.auto_upload}
                onChange={(e) =>
                  onUpdateFormationSettings({ auto_upload: e.target.checked })
                }
              />
              <span>auto_upload</span>
            </label>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...settingLabelStyle, marginBottom: 0 }}>output</span>
              <select
                value={safeFormationSettings.output ?? ''}
                onChange={(e) =>
                  onUpdateFormationSettings({ output: e.target.value })
                }
                title="기본값(미지정)이면 백엔드가 .skyc 파일을 응답으로 보냅니다."
                style={{
                  ...smallInputStyle,
                  flex: 1,
                  padding: '6px 8px',
                }}
              >
                {FORMATION_OUTPUT_OPTIONS.map((opt) => (
                  <option
                    key={opt.value || '__default'}
                    value={opt.value}
                    style={{ color: '#000' }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isSendingFormation || formationPhases.length === 0}
          onClick={onSendFormationPlan}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(120, 255, 175, 0.42)',
            background:
              isSendingFormation || formationPhases.length === 0
                ? 'rgba(80, 116, 97, 0.45)'
                : 'rgba(25, 129, 76, 0.42)',
            color: '#e8fff1',
            cursor:
              isSendingFormation || formationPhases.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 0.2,
          }}
        >
          {isSendingFormation ? '전달 중...' : '포메이션 전달하기'}
        </button>

        {formationDeliveryStatus && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(126, 200, 255, 0.28)',
              background: 'rgba(83, 170, 255, 0.12)',
              color: '#cce8ff',
              whiteSpace: 'pre-line',
              fontSize: 11.5,
            }}
          >
            {formationDeliveryStatus}
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.55, lineHeight: 1.5 }}>
          POST /api/v1/path-planner/plan
          <br />
          phase에 위치가 캡처되지 않은 드론은 자동으로 초기 위치를 사용합니다.
        </div>
      </>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        right: 0,
        width: 460,
        maxWidth: 'min(460px, 92vw)',
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
            <div
              style={{
                marginBottom: 12,
                padding: '10px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(126, 200, 255, 0.18)',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.62, marginBottom: 6 }}>초기 위치 (x, y, z)</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <input
                  value={initialFields.ix}
                  onChange={(e) => setInitialFields((p) => ({ ...p, ix: e.target.value }))}
                  placeholder="X"
                  inputMode="decimal"
                  style={smallInputStyle}
                />
                <input
                  value={initialFields.iy}
                  onChange={(e) => setInitialFields((p) => ({ ...p, iy: e.target.value }))}
                  placeholder="Y"
                  inputMode="decimal"
                  style={smallInputStyle}
                />
                <input
                  value={initialFields.iz}
                  onChange={(e) => setInitialFields((p) => ({ ...p, iz: e.target.value }))}
                  placeholder="Z"
                  inputMode="decimal"
                  style={smallInputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={fillInitialFromCurrentPosition}
                  style={{ ...secondaryBtnStyle, flex: '1 1 120px' }}
                >
                  현재 위치로 채우기
                </button>
                <button
                  type="button"
                  onClick={() => applyInitialPosition({ moveDrone: false })}
                  style={{
                    ...secondaryBtnStyle,
                    flex: '1 1 120px',
                    border: '1px solid rgba(120, 190, 255, 0.45)',
                    fontWeight: 600,
                  }}
                >
                  초기 위치 적용
                </button>
                <button
                  type="button"
                  onClick={() => applyInitialPosition({ moveDrone: true })}
                  title="씬에서 드론 마커를 입력 좌표로 즉시 이동합니다."
                  style={{ ...secondaryBtnStyle, flex: '1 1 120px' }}
                >
                  적용 후 드론 이동
                </button>
              </div>
              <div style={{ fontSize: 10.5, opacity: 0.52, marginTop: 8, lineHeight: 1.45 }}>
                JSON보내기·재생 기준 시작점과 맞추려면 경로가 있을 때 첫 점 좌표도 함께 갱신됩니다.
              </div>
            </div>

            {/* Tab switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                padding: 4,
                borderRadius: 10,
                border: '1px solid rgba(126, 200, 255, 0.22)',
                background: 'rgba(255,255,255,0.04)',
                marginBottom: 14,
              }}
            >
              {[
                { id: 'path', label: 'Path' },
                { id: 'formation', label: 'Formation' },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 7,
                      border: '1px solid transparent',
                      background: active
                        ? 'linear-gradient(140deg, rgba(56,141,255,0.4), rgba(40,104,194,0.4))'
                        : 'transparent',
                      color: active ? '#f4faff' : 'rgba(220,234,250,0.7)',
                      cursor: 'pointer',
                      fontWeight: active ? 700 : 500,
                      fontSize: 12.5,
                      letterSpacing: 0.2,
                      transition: 'background 120ms ease',
                    }}
                  >
                    {tab.label}
                    {tab.id === 'formation' && formationPhases.length > 0 ? (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: '1px 6px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.18)',
                          color: '#f4faff',
                          fontSize: 10.5,
                          fontWeight: 700,
                        }}
                      >
                        {formationPhases.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {activeTab === 'path' ? renderPathTab() : renderFormationTab()}
          </>
        )}

        {/* 드론 삭제 */}
        {drone && (
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
        )}
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

const phaseIconBtnStyle = {
  width: 30,
  padding: '6px 0',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.06)',
  color: '#e6f1ff',
  fontSize: 12,
};

const phaseSmallBtnStyle = {
  padding: '6px 8px',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.07)',
  color: '#e6f1ff',
  cursor: 'pointer',
  fontSize: 11.5,
};

const settingLabelStyle = {
  fontSize: 10.5,
  opacity: 0.6,
  marginBottom: 3,
};

DroneInfoPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  drone: PropTypes.shape({
    id: PropTypes.string,
    battery: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    batteryPercentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    batteryVoltage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gpsFix: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    heading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ahl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    agl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amsl: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    satellites: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currentPosition: PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      z: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    path: PropTypes.array,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onClose: PropTypes.func.isRequired,
  droneCount: PropTypes.number,
  formationPhases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      holdMs: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      points: PropTypes.object,
    })
  ),
  formationSettings: PropTypes.shape({
    step_size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration_ms: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    takeoff_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    auto_upload: PropTypes.bool,
    output: PropTypes.string,
  }),
  isSendingFormation: PropTypes.bool,
  formationDeliveryStatus: PropTypes.string,
  onAddFormationPhase: PropTypes.func,
  onRemoveFormationPhase: PropTypes.func,
  onMoveFormationPhase: PropTypes.func,
  onUpdateFormationPhaseMeta: PropTypes.func,
  onUpdateFormationDronePosition: PropTypes.func,
  onCaptureDronePositionInPhase: PropTypes.func,
  onCaptureAllPositionsInPhase: PropTypes.func,
  onApplyDronePositionInPhase: PropTypes.func,
  onApplyAllDronesInPhase: PropTypes.func,
  onUpdateFormationSettings: PropTypes.func,
  onSendFormationPlan: PropTypes.func,
};
