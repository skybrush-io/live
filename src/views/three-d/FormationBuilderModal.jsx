import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

const DEFAULT_URL = '/api/v1/path-planner/plan';

const round3 = (value) => Math.round(Number(value) * 1000) / 1000;

const getSceneDronePositions = (droneIds) => {
  if (typeof document === 'undefined') return [];
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return [];

  return droneIds
    .map((droneId) => {
      const safeId =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(droneId)
          : droneId;
      const target = sceneEl.querySelector(`[data-drone-id="${safeId}"]`);
      const pos = target?.getAttribute?.('position');
      if (!pos || typeof pos !== 'object') return null;

      const x = Number(pos.x);
      const y = Number(pos.y);
      const z = Number(pos.z);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;

      return {
        droneId,
        x: round3(x),
        y: round3(y),
        z: round3(z),
      };
    })
    .filter(Boolean);
};

const makeDefaultPhase = (index, points) => ({
  name: `phase-${index + 1}`,
  holdMs: 3000,
  points,
});

const getErrorMessage = async (response) => {
  const text = await response.text().catch(() => '');
  if (!text) return response.statusText || `요청 실패: ${response.status}`;
  try {
    const parsed = JSON.parse(text);
    return (
      (typeof parsed.error === 'string' && parsed.error) ||
      (typeof parsed.message === 'string' && parsed.message) ||
      JSON.stringify(parsed, null, 2)
    );
  } catch {
    return text;
  }
};

export default function FormationBuilderModal({ open, onClose, droneIds }) {
  const [initial, setInitial] = useState([]);
  const [phases, setPhases] = useState([]);
  const [stepSize, setStepSize] = useState('1.0');
  const [durationMs, setDurationMs] = useState('1000');
  const [takeoffTime, setTakeoffTime] = useState('5');
  const [autoUpload, setAutoUpload] = useState(false);
  const [output, setOutput] = useState('path');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('');

  const droneCountLabel = `${droneIds.length}대`;

  const canSend = useMemo(
    () =>
      initial.length === droneIds.length &&
      phases.length > 0 &&
      phases.every(
        (phase) =>
          phase.name &&
          Number.isFinite(Number(phase.holdMs)) &&
          Number(phase.holdMs) >= 0 &&
          Array.isArray(phase.points) &&
          phase.points.length === droneIds.length
      ),
    [droneIds.length, initial.length, phases]
  );

  if (!open) return null;

  const captureCurrent = () => getSceneDronePositions(droneIds);

  const handleCaptureInitial = () => {
    const captured = captureCurrent();
    if (captured.length !== droneIds.length) {
      setStatus(`초기 위치 캡처 실패: ${droneIds.length}대 중 ${captured.length}대만 감지되었습니다.`);
      return;
    }
    setInitial(captured);
    setStatus(`초기 위치 캡처 완료 (${captured.length}대)`);
  };

  const handleAddPhase = () => {
    const captured = captureCurrent();
    if (captured.length !== droneIds.length) {
      setStatus(`포메이션 캡처 실패: ${droneIds.length}대 중 ${captured.length}대만 감지되었습니다.`);
      return;
    }
    setPhases((prev) => [...prev, makeDefaultPhase(prev.length, captured)]);
    setStatus(`phase 추가 완료 (${captured.length}대)`);
  };

  const handleRecapturePhase = (index) => {
    const captured = captureCurrent();
    if (captured.length !== droneIds.length) {
      setStatus(`phase 재캡처 실패: ${droneIds.length}대 중 ${captured.length}대만 감지되었습니다.`);
      return;
    }

    setPhases((prev) =>
      prev.map((phase, i) => (i === index ? { ...phase, points: captured } : phase))
    );
    setStatus(`phase ${index + 1} 재캡처 완료`);
  };

  const handleSend = async () => {
    const payload = {
      initial,
      phases: phases.map((phase) => ({
        name: phase.name,
        holdMs: Math.max(0, Number(phase.holdMs) || 0),
        points: phase.points,
      })),
      step_size: Number.isFinite(Number(stepSize)) && Number(stepSize) > 0 ? Number(stepSize) : 1.0,
      duration_ms:
        Number.isFinite(Number(durationMs)) && Number(durationMs) > 0 ? Number(durationMs) : 1000,
      takeoff_time:
        Number.isFinite(Number(takeoffTime)) && Number(takeoffTime) >= 0 ? Number(takeoffTime) : 5,
      auto_upload: !!autoUpload,
      output,
    };

    setIsSending(true);
    setStatus('');
    try {
      const response = await fetch(DEFAULT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      if (output === 'show' || output === 'path') {
        const json = await response.json().catch(() => null);
        setStatus(
          json
            ? `전송 완료 (${payload.phases.length} phases)\n${JSON.stringify(json, null, 2)}`
            : `전송 완료 (${payload.phases.length} phases)`
        );
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `formation-result.${output}`;
      document.body.appendChild(a);
      a.click();
      if (a.parentNode === document.body) document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      setStatus(`전송 완료: formation-result.${output} 다운로드 시작`);
    } catch (error) {
      setStatus(`전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 22000,
        background: 'rgba(6,10,16,0.62)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 920,
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'linear-gradient(165deg, rgba(18,24,36,0.97), rgba(11,16,26,0.95))',
          borderRadius: 14,
          padding: '18px 20px',
          color: '#f3f8ff',
          border: '1px solid rgba(126, 200, 255, 0.26)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>포메이션 빌더</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>3D에서 배치한 드론 위치를 캡처해 phase 생성 ({droneCountLabel})</div>
          </div>
          <button type="button" onClick={onClose} style={buttonStyle}>
            닫기
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={handleCaptureInitial} style={buttonStyle}>
            초기 위치 캡처
          </button>
          <button type="button" onClick={handleAddPhase} style={buttonStyle}>
            현재 배치로 phase 추가
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.82 }}>
          initial: {initial.length}/{droneIds.length} · phases: {phases.length}
        </div>

        <div style={{ marginTop: 10 }}>
          {phases.map((phase, index) => (
            <div
              key={`${phase.name}-${index}`}
              style={{
                border: '1px solid rgba(126, 200, 255, 0.26)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={phase.name}
                  onChange={(e) =>
                    setPhases((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                    )
                  }
                  placeholder="phase 이름"
                  style={inputStyle}
                />
                <input
                  value={String(phase.holdMs)}
                  onChange={(e) =>
                    setPhases((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, holdMs: e.target.value } : item
                      )
                    )
                  }
                  placeholder="holdMs"
                  inputMode="numeric"
                  style={{ ...inputStyle, width: 110 }}
                />
                <button type="button" onClick={() => handleRecapturePhase(index)} style={buttonStyle}>
                  현재 배치로 재캡처
                </button>
                <button
                  type="button"
                  onClick={() => setPhases((prev) => prev.filter((_, i) => i !== index))}
                  style={dangerButtonStyle}
                >
                  삭제
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, opacity: 0.72 }}>
                points {phase.points.length}/{droneIds.length}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.16)',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          <input value={stepSize} onChange={(e) => setStepSize(e.target.value)} placeholder="step_size" style={inputStyle} />
          <input value={durationMs} onChange={(e) => setDurationMs(e.target.value)} placeholder="duration_ms" style={inputStyle} />
          <input value={takeoffTime} onChange={(e) => setTakeoffTime(e.target.value)} placeholder="takeoff_time" style={inputStyle} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input type="checkbox" checked={autoUpload} onChange={(e) => setAutoUpload(e.target.checked)} />
            auto_upload
          </label>
          <select value={output} onChange={(e) => setOutput(e.target.value)} style={inputStyle}>
            <option value="path">path</option>
            <option value="show">show</option>
            <option value="skyc">skyc</option>
          </select>
          <button
            type="button"
            disabled={!canSend || isSending}
            onClick={handleSend}
            style={{
              ...buttonStyle,
              opacity: canSend && !isSending ? 1 : 0.65,
              cursor: canSend && !isSending ? 'pointer' : 'not-allowed',
            }}
          >
            {isSending ? '전송 중...' : '포메이션 전송'}
          </button>
        </div>

        {status && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(126, 200, 255, 0.3)',
              background: 'rgba(83, 170, 255, 0.12)',
              color: '#cce8ff',
              fontSize: 12,
              whiteSpace: 'pre-line',
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(245,250,255,0.08)',
  border: '1px solid rgba(130,190,255,0.24)',
  borderRadius: 8,
  color: '#ecf5ff',
  padding: '8px 10px',
  fontSize: 12.5,
  boxSizing: 'border-box',
  outline: 'none',
};

const buttonStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.1)',
  color: '#f1f7ff',
  cursor: 'pointer',
  fontSize: 12.5,
};

const dangerButtonStyle = {
  ...buttonStyle,
  border: '1px solid rgba(255,120,120,0.4)',
  background: 'rgba(110, 22, 22, 0.34)',
  color: '#ffd9d9',
};

FormationBuilderModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  droneIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};
