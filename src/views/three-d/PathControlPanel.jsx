import PropTypes from 'prop-types';
import React from 'react';

export default function PathControlPanel({
  fileInputRef,
  pathProgress,
  onPathProgressChange,
  currentPositionMs,
  totalDurationMs,
  onPlayAll,
  onResetAll,
  onLoadConfigClick,
  onSaveConfigClick,
  onFileChange,
}) {
  const formatMs = (ms) => {
    const safe = Math.max(0, Math.round(Number(ms) || 0));
    const totalSec = Math.floor(safe / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          zIndex: 11000,
          padding: 8,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: 12,
          minWidth: 260,
          maxWidth: 340,
        }}
      >
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Path & JSON</div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ marginBottom: 2 }}>재생 위치</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min="0"
              max="100"
              value={pathProgress}
              onChange={(e) => onPathProgressChange(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ width: 32, textAlign: 'right' }}>{Math.round(pathProgress)}%</span>
          </div>
          <div style={{ marginTop: 4, opacity: 0.75 }}>
            재생 시간 {formatMs(currentPositionMs)} / {formatMs(totalDurationMs)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <button
            type="button"
            onClick={onPlayAll}
            style={{
              flex: 1.4,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            전체 재생
          </button>
          <button
            type="button"
            onClick={onResetAll}
            style={{
              flex: 1,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            원위치
          </button>
          <button
            type="button"
            onClick={onLoadConfigClick}
            style={{
              flex: 0.9,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            불러오기
          </button>
          <button
            type="button"
            onClick={onSaveConfigClick}
            style={{
              flex: 0.9,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </>
  );
}

PathControlPanel.propTypes = {
  fileInputRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  pathProgress: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onPathProgressChange: PropTypes.func.isRequired,
  currentPositionMs: PropTypes.number.isRequired,
  totalDurationMs: PropTypes.number.isRequired,
  onPlayAll: PropTypes.func.isRequired,
  onResetAll: PropTypes.func.isRequired,
  onLoadConfigClick: PropTypes.func.isRequired,
  onSaveConfigClick: PropTypes.func.isRequired,
  onFileChange: PropTypes.func.isRequired,
};
