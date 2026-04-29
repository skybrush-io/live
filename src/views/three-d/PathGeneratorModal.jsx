import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

const DEFAULT_PATH_PLANNER_URL = 'http://localhost:5001/api/v1/path-planner/plan';

const parseResponseBodyAsText = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const body = await response.json();
      return JSON.stringify(body);
    } catch (e) {
      return '';
    }
  }
  try {
    return await response.text();
  } catch (e) {
    return '';
  }
};

const tryParseJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};

// Format a list of structured validation issues coming from the
// path-planner backend into a human-readable, multi-line string.
// Each issue has the shape:
//   { code, severity, message, validator, details: { ... } }
const formatValidationIssues = (issues) => {
  if (!Array.isArray(issues) || issues.length === 0) return '';
  return issues
    .map((issue) => {
      const tag = (issue.severity || 'error').toUpperCase();
      const code = issue.code || 'UNKNOWN';
      const validator = issue.validator ? ` [${issue.validator}]` : '';
      const head = `[${tag}]${validator} ${code}: ${issue.message || ''}`;
      const details = issue.details;
      if (!details || typeof details !== 'object') return head;

      const violations = Array.isArray(details.violations)
        ? details.violations
            .map((v) => `${v.label}[${v.index}] z=${v.z}`)
            .join(', ')
        : '';
      const min = details.min_alt_m != null ? `min=${details.min_alt_m}m` : '';
      const extras = [min, violations].filter(Boolean).join(' | ');
      return extras ? `${head}\n  ${extras}` : head;
    })
    .join('\n');
};

const getFallbackRelativeUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl, window.location.href);
    return `${parsed.pathname}${parsed.search || ''}`;
  } catch (e) {
    return '';
  }
};

const parsePointList = (rawText, key) => {
  const keyMatch = rawText.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i'));
  if (!keyMatch) {
    throw new Error(`"${key}" 값을 찾을 수 없습니다.`);
  }

  const block = keyMatch[1] || '';
  const tupleMatches = block.match(/\(([^()]+)\)/g) || [];

  if (!tupleMatches.length) {
    return [];
  }

  const points = tupleMatches.map((tuple) => {
    const values = tuple
      .slice(1, -1)
      .split(',')
      .map((v) => Number(v.trim()));

    if (values.length !== 3 || values.some((n) => !Number.isFinite(n))) {
      throw new Error(`"${key}"의 좌표 형식이 올바르지 않습니다. 예: (0, 1, 2)`);
    }

    return values;
  });

  return points;
};

const normalizePointList = (value, key) => {
  if (!Array.isArray(value)) {
    throw new Error(`"${key}"는 배열이어야 합니다.`);
  }

  const points = value.map((point) => {
    if (!Array.isArray(point) || point.length !== 3) {
      throw new Error(`"${key}"의 좌표 형식이 올바르지 않습니다. 예: [0, 1, 2]`);
    }

    const values = point.map((n) => Number(n));
    if (values.some((n) => !Number.isFinite(n))) {
      throw new Error(`"${key}"의 좌표 값은 숫자여야 합니다.`);
    }
    return values;
  });

  return points;
};

const parseInitialTargetInput = (rawText) => {
  // 우선 JSON 형식을 시도: { "initial": [[x,y,z], ...], "target": [[x,y,z], ...] }
  try {
    const parsedJson = JSON.parse(rawText);
    if (parsedJson && typeof parsedJson === 'object') {
      const initial = normalizePointList(parsedJson.initial, 'initial');
      const target = normalizePointList(parsedJson.target, 'target');

      if (!initial.length) {
        throw new Error('"initial" 좌표가 비어 있습니다.');
      }
      if (!target.length) {
        throw new Error('"target" 좌표가 비어 있습니다.');
      }

      return { initial, target };
    }
  } catch (e) {
    // JSON 파싱 실패 시 기존 튜플 텍스트 형식으로 폴백
  }

  // 레거시 텍스트 형식: initial: [(0, 1, 2), ...]
  const initial = parsePointList(rawText, 'initial');
  const target = parsePointList(rawText, 'target');

  if (!initial.length) {
    throw new Error('"initial" 좌표가 비어 있습니다.');
  }
  if (!target.length) {
    throw new Error('"target" 좌표가 비어 있습니다.');
  }

  return { initial, target };
};

const toPreviewPosition = (point) => {
  const [x, y, z] = point;
  // 앱 좌표계는 Z-up 기준이므로, A-Frame 미리보기(Y-up)로 변환한다.
  return [x, z, y];
};

const MiniScene = ({ title, points, color }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ marginBottom: 6, fontWeight: 700, fontSize: 12, letterSpacing: 0.2 }}>
      {title}
    </div>
    <div
      style={{
        height: 220,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <a-scene
        embedded='true'
        vr-mode-ui='enabled: false'
        xr-mode-ui='enabled: false'
        device-orientation-permission-ui='enabled: false'
        renderer='antialias: true; colorManagement: true; physicallyCorrectLights: true'
      >
        <a-entity light='type: ambient; color: #b3d7ff; intensity: 0.7' />
        <a-entity light='type: directional; color: #ffffff; intensity: 0.85' position='2 6 4' />

        <a-plane
          position='0 0 0'
          rotation='-90 0 0'
          width='40'
          height='40'
          color='#1b2638'
          material='opacity: 0.92'
        />

        {points.map((point, index) => {
          const previewPos = toPreviewPosition(point);
          return (
            <a-entity
              key={`${title}-${index}`}
              position={`${previewPos[0]} ${previewPos[1]} ${previewPos[2]}`}
            >
            <a-sphere radius='0.35' color={color} />
            <a-entity
              position='0 0.55 0'
              text={`value: ${index + 1}; align: center; color: #ffffff; width: 3`}
            />
          </a-entity>
          );
        })}

        <a-camera position='0 9 20' rotation='-18 0 0' />
      </a-scene>
    </div>
  </div>
);

MiniScene.propTypes = {
  title: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  color: PropTypes.string.isRequired,
};

export default function PathGeneratorModal({ open, onClose }) {
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState('');
  const [requestUrl, setRequestUrl] = useState(DEFAULT_PATH_PLANNER_URL);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const [previewData, setPreviewData] = useState({ initial: [], target: [] });

  const summary = useMemo(
    () => `initial ${previewData.initial.length}개 / target ${previewData.target.length}개`,
    [previewData]
  );

  if (!open) return null;

  const handlePreview = () => {
    try {
      const parsed = parseInitialTargetInput(rawInput);
      setPreviewData(parsed);
      setError('');
      setRequestStatus('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '입력 파싱에 실패했습니다.');
      setRequestStatus('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 21000,
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
          padding: '20px 22px',
          color: '#f3f8ff',
          width: 980,
          maxWidth: 'calc(100vw - 56px)',
          border: '1px solid rgba(126, 200, 255, 0.26)',
          boxShadow: '0 14px 32px rgba(0,0,0,0.42)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>경로 생성하기</div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <MiniScene title='initial' points={previewData.initial} color='#9dd3ff' />
          <MiniScene title='target' points={previewData.target} color='#ffd58a' />
        </div>

        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: 140,
            resize: 'vertical',
            background: 'rgba(245,250,255,0.08)',
            border: '1px solid rgba(130,190,255,0.24)',
            borderRadius: 10,
            color: '#ecf5ff',
            padding: '10px 12px',
            fontSize: 13,
            boxSizing: 'border-box',
            outline: 'none',
            fontFamily: 'Consolas, monospace',
          }}
        />

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{summary}</div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.82, marginBottom: 6 }}>요청 URL</div>
          <input
            value={requestUrl}
            onChange={(e) => setRequestUrl(e.target.value)}
            placeholder={DEFAULT_PATH_PLANNER_URL}
            style={{
              width: '100%',
              background: 'rgba(245,250,255,0.08)',
              border: '1px solid rgba(130,190,255,0.24)',
              borderRadius: 8,
              color: '#ecf5ff',
              padding: '8px 10px',
              fontSize: 12.5,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        {error && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255,80,80,0.15)',
              border: '1px solid rgba(255,80,80,0.45)',
              color: '#ffb3b3',
              fontSize: 12,
              whiteSpace: 'pre-line',
              fontFamily: 'Consolas, monospace',
            }}
          >
            {error}
          </div>
        )}
        {requestStatus && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(83, 170, 255, 0.15)',
              border: '1px solid rgba(83, 170, 255, 0.45)',
              color: '#cce8ff',
              fontSize: 12,
              whiteSpace: 'pre-line',
            }}
          >
            {requestStatus}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type='button'
              onClick={handlePreview}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid rgba(126, 200, 255, 0.45)',
                background: 'rgba(26, 80, 126, 0.5)',
                color: '#e6f3ff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              미리보기 갱신
            </button>
            <button
              type='button'
              disabled={isRequesting}
              onClick={async () => {
                try {
                  setError('');
                  setRequestStatus('');

                  const payload = parseInitialTargetInput(rawInput);
                  setPreviewData(payload);

                  if (!requestUrl || !requestUrl.trim()) {
                    throw new Error('요청 URL을 입력해주세요.');
                  }

                  setIsRequesting(true);
                  const usedUrl = getFallbackRelativeUrl(requestUrl.trim()) || requestUrl.trim();
                  const response = await fetch(usedUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                  });

                  if (!response.ok) {
                    // Structured validation failure (422 from path-planner):
                    // surface the issue list in a readable form.
                    if (response.status === 422) {
                      const json = await tryParseJsonResponse(response);
                      const issues = json?.validation?.issues || [];
                      const formatted = formatValidationIssues(issues);
                      throw new Error(
                        formatted
                          ? `Path 컴파일 검증 실패:\n${formatted}`
                          : `Path 컴파일 검증 실패 (URL: ${usedUrl})`
                      );
                    }

                    const errorBody = await parseResponseBodyAsText(response);
                    if (response.status === 404 && usedUrl.startsWith('/api/')) {
                      throw new Error(
                        `요청 실패: 404 Not Found (URL: ${usedUrl})\n` +
                          '개발 서버 프록시가 아직 반영되지 않았을 수 있습니다. 프론트 dev 서버를 재시작해주세요.'
                      );
                    }
                    throw new Error(
                      `요청 실패: ${response.status} ${response.statusText} (URL: ${usedUrl})${
                        errorBody ? `\n응답: ${errorBody}` : ''
                      }`
                    );
                  }

                  const result = await response.json();
                  if (!result || !Array.isArray(result.drones)) {
                    throw new Error('응답 형식이 올바르지 않습니다. (drones 배열 필요)');
                  }

                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('path-generator-response', { detail: result })
                    );
                  }

                  // Surface non-blocking validation warnings, if any.
                  const warnIssues = (result?.validation?.issues || []).filter(
                    (i) => i.severity === 'warning'
                  );
                  const warnText = formatValidationIssues(warnIssues);
                  setRequestStatus(
                    warnText
                      ? `경로 요청 성공: ${result.drones.length}개 드론 반영됨\n경고:\n${warnText}`
                      : `경로 요청 성공: ${result.drones.length}개 드론 반영됨`
                  );
                } catch (e) {
                  if (e instanceof TypeError) {
                    setError(
                      `네트워크/CORS 오류로 요청에 실패했습니다.\n` +
                        `서버가 실행 중인지, CORS 허용(origin) 설정이 되어있는지 확인해주세요.\n` +
                        `URL: ${requestUrl.trim()}`
                    );
                  } else {
                    setError(e instanceof Error ? e.message : '경로 요청에 실패했습니다.');
                  }
                } finally {
                  setIsRequesting(false);
                }
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid rgba(120, 255, 175, 0.45)',
                background: isRequesting
                  ? 'rgba(80, 116, 97, 0.45)'
                  : 'rgba(25, 129, 76, 0.5)',
                color: '#e8fff1',
                cursor: isRequesting ? 'wait' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                opacity: isRequesting ? 0.75 : 1,
              }}
            >
              {isRequesting ? '요청 중...' : '경로 요청하기'}
            </button>
          </div>

          <button
            type='button'
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(243,248,255,0.9)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

PathGeneratorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
