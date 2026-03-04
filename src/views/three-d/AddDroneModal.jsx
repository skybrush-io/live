import React, { useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = ['Idle', 'Flying', 'Charging', 'Returning'];

const inputStyle = {
  width: '100%',
  background: 'rgba(245,250,255,0.08)',
  border: '1px solid rgba(130,190,255,0.24)',
  borderRadius: 8,
  color: '#ecf5ff',
  padding: '8px 10px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  marginBottom: 14,
};

const labelTextStyle = {
  fontSize: 11,
  opacity: 0.72,
  marginBottom: 5,
  letterSpacing: 0.2,
};

export default function AddDroneModal({ open, onClose, onAdd, existingIds }) {
  const [name, setName] = useState('');
  const [posX, setPosX] = useState('0');
  const [posY, setPosY] = useState('1');
  const [posZ, setPosZ] = useState('1');
  const [battery, setBattery] = useState('100');
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');

  if (!open) return null;

  const generateId = () => {
    const ids = existingIds || [];
    let idx = ids.length + 1;
    let candidate = `drone-${idx}`;
    while (ids.includes(candidate)) {
      idx += 1;
      candidate = `drone-${idx}`;
    }
    return candidate;
  };

  const handleAdd = () => {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }

    const nx = Number(posX);
    const ny = Number(posY);
    const nz = Number(posZ);

    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
      setError('위치 값이 올바르지 않습니다.');
      return;
    }

    const bat = Number(battery);
    const safeBat = Number.isFinite(bat) ? Math.min(100, Math.max(0, bat)) : 100;

    onAdd({
      id: generateId(),
      name: trimmedName,
      battery: safeBat,
      status,
      pos: [nx, ny, nz],
      path: [],
    });

    setName('');
    setPosX('0');
    setPosY('1');
    setPosZ('1');
    setBattery('100');
    setStatus('Idle');
    setError('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') onClose();
  };

  const isValid = name.trim().length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
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
          background: 'linear-gradient(165deg, rgba(18,24,36,0.97), rgba(11,16,26,0.95))',
          borderRadius: 14,
          padding: '22px 24px',
          color: '#f3f8ff',
          width: 360,
          border: '1px solid rgba(126, 200, 255, 0.26)',
          boxShadow: '0 14px 32px rgba(0,0,0,0.42)',
        }}
        onKeyDown={handleKeyDown}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 17 }}>✈</span>
          드론 추가
        </div>

        {/* 이름 */}
        <label style={labelStyle}>
          <div style={labelTextStyle}>이름 *</div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: Drone F"
            style={inputStyle}
          />
        </label>

        {/* 초기 위치 */}
        <div style={{ marginBottom: 14 }}>
          <div style={labelTextStyle}>초기 위치 (X / Y / Z)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'X', val: posX, set: setPosX },
              { label: 'Y', val: posY, set: setPosY },
              { label: 'Z', val: posZ, set: setPosZ },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.56,
                    marginBottom: 3,
                    textAlign: 'center',
                  }}
                >
                  {label}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 배터리 */}
        <label style={labelStyle}>
          <div style={labelTextStyle}>배터리 (%)</div>
          <input
            type="number"
            min="0"
            max="100"
            value={battery}
            onChange={(e) => setBattery(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* 상태 */}
        <label style={{ ...labelStyle, marginBottom: 20 }}>
          <div style={labelTextStyle}>상태</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} style={{ background: '#1a1a2e' }}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {/* 오류 메시지 */}
        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'rgba(255,80,80,0.15)',
              border: '1px solid rgba(255,80,80,0.4)',
              color: '#ff8080',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(243,248,255,0.86)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isValid}
            style={{
              padding: '8px 22px',
              borderRadius: 8,
              border: 'none',
              background: isValid
                ? 'linear-gradient(135deg, #4ea8ff, #2a79d9)'
                : 'rgba(255,255,255,0.12)',
              color: isValid ? '#ffffff' : 'rgba(255,255,255,0.36)',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

AddDroneModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  existingIds: PropTypes.arrayOf(PropTypes.string),
};
