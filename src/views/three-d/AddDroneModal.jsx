import React, { useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = ['Idle', 'Flying', 'Charging', 'Returning'];

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6,
  color: 'white',
  padding: '6px 10px',
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
  opacity: 0.65,
  marginBottom: 4,
  letterSpacing: 0.3,
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
        background: 'rgba(0,0,0,0.55)',
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
          background: '#1a1a2e',
          borderRadius: 12,
          padding: '24px 28px',
          color: 'white',
          width: 360,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
        onKeyDown={handleKeyDown}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>✈</span>
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
                    opacity: 0.5,
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
              padding: '6px 10px',
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
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
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
              padding: '7px 22px',
              borderRadius: 7,
              border: 'none',
              background: isValid
                ? 'linear-gradient(135deg, #4a9eff, #2b7cdd)'
                : 'rgba(255,255,255,0.1)',
              color: isValid ? 'white' : 'rgba(255,255,255,0.3)',
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
