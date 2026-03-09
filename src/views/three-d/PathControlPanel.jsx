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
  onResetPanelSettings,
  onLoadConfigClick,
  onSaveConfigClick,
  onFileChange,
  onAddDroneClick,
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
          left: 14,
          bottom: 14,
          zIndex: 11000,
          padding: 14,
          borderRadius: 14,
          background: 'linear-gradient(165deg, rgba(18,24,36,0.9), rgba(10,14,22,0.88))',
          border: '1px solid rgba(126, 200, 255, 0.24)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          color: '#eef6ff',
          fontSize: 12,
          minWidth: 300,
          maxWidth: 360,
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.2 }}>Path Control</div>
            <div style={{ opacity: 0.66, fontSize: 11, marginTop: 1 }}>재생 및 JSON 관리</div>
          </div>
          <button
            type="button"
            onClick={onAddDroneClick}
            style={{
              padding: '6px 11px',
              borderRadius: 8,
              border: '1px solid rgba(96,173,255,0.72)',
              background: 'linear-gradient(140deg, rgba(56,141,255,0.32), rgba(40,104,194,0.34))',
              color: '#d8ecff',
              cursor: 'pointer',
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            + 드론
          </button>
        </div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ marginBottom: 4, fontSize: 11.5, opacity: 0.84 }}>재생 위치</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min="0"
              max="100"
              value={pathProgress}
              onChange={(e) => onPathProgressChange(e.target.value)}
              style={{ flex: 1, accentColor: '#67b4ff' }}
            />
            <span style={{ width: 36, textAlign: 'right', color: '#a9d8ff', fontWeight: 700 }}>
              {Math.round(pathProgress)}%
            </span>
          </div>
          <div style={{ marginTop: 5, opacity: 0.8, fontSize: 11.5 }}>
            재생 시간 {formatMs(currentPositionMs)} / {formatMs(totalDurationMs)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={onPlayAll}
            style={{
              flex: 1.4,
              padding: '7px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.12)',
              color: '#f7fbff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            전체 재생
          </button>
          <button
            type="button"
            onClick={onResetAll}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.06)',
              color: '#f7fbff',
              cursor: 'pointer',
            }}
          >
            원위치
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onLoadConfigClick}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(8,12,18,0.6)',
              color: '#dce7f2',
              cursor: 'pointer',
            }}
          >
            불러오기
          </button>
          <button
            type="button"
            onClick={onSaveConfigClick}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(8,12,18,0.42)',
              color: '#dce7f2',
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onResetPanelSettings}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255, 120, 120, 0.36)',
              background: 'rgba(110, 22, 22, 0.34)',
              color: '#ffd9d9',
              cursor: 'pointer',
            }}
          >
            설정 초기화
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
  onResetPanelSettings: PropTypes.func.isRequired,
  onLoadConfigClick: PropTypes.func.isRequired,
  onSaveConfigClick: PropTypes.func.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onAddDroneClick: PropTypes.func.isRequired,
};
