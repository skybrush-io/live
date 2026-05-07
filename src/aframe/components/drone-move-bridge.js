import AFrame from '@skybrush/aframe-components';

if (!AFrame.components['drone-move-bridge']) {
  AFrame.registerComponent('drone-move-bridge', {
    init() {
      this._onMove = this._onMove.bind(this);
      this._onPath = this._onPath.bind(this);
      this._onInitialPosSet = this._onInitialPosSet.bind(this);
      // 드론별로 경로 애니메이션 취소 함수를 따로 관리
      this._currentPathCancels = {};
      window.addEventListener('drone-move-request', this._onMove);
      window.addEventListener('drone-path-request', this._onPath);
      window.addEventListener('drone-initial-pos-set', this._onInitialPosSet);
    },

    remove() {
      window.removeEventListener('drone-move-request', this._onMove);
      window.removeEventListener('drone-path-request', this._onPath);
      window.removeEventListener('drone-initial-pos-set', this._onInitialPosSet);

      if (this._currentPathCancels) {
        Object.values(this._currentPathCancels).forEach((cancel) => {
          if (typeof cancel !== 'function') return;
          try {
            cancel();
          } catch {
            // ignore
          }
        });
        this._currentPathCancels = {};
      }
    },

    _onMove(e) {
      const { id, x, y, z } = e.detail || {};
      if (!id) return;

      const sceneEl = this.el.sceneEl || this.el; // scene에 붙여도 되고 entity에 붙여도 됨
      const target = sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
      if (!target) {
        console.warn('[drone-move-bridge] target not found:', id);
        return;
      }

      if (this._currentPathCancels[id]) {
        this._currentPathCancels[id]();
        this._currentPathCancels[id] = undefined;
      }

      // 단일 이동은 즉시 위치 변경
      target.setAttribute('position', `${x} ${y} ${z}`);

      // 선택적으로: 패널 값 갱신용 이벤트
      window.dispatchEvent(
        new CustomEvent('drone-moved', { detail: { id, x, y, z } })
      );
    },

    _onInitialPosSet(e) {
      const { id, x, y, z } = e.detail || {};
      if (!id) return;

      const nx = Number(x);
      const ny = Number(y);
      const nz = Number(z);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return;

      const sceneEl = this.el.sceneEl || this.el;
      const target = sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
      if (!target) {
        console.warn('[drone-move-bridge] initial-pos target not found:', id);
        return;
      }

      target.setAttribute('data-initial-pos', `${nx} ${ny} ${nz}`);
      window.dispatchEvent(
        new CustomEvent('drone-initial-pos-updated', {
          detail: { id, x: nx, y: ny, z: nz },
        })
      );
    },

    _onPath(e) {
      const { id, points, durationPerSegment = 1000, startFromInitial = true } = e.detail || {};
      if (!id || !Array.isArray(points) || points.length === 0) return;

      const sceneEl = this.el.sceneEl || this.el;
      const target = sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
      if (!target) {
        console.warn('[drone-move-bridge] path target not found:', id);
        return;
      }

      // 기존 경로 애니메이션 정리 (해당 드론만)
      if (this._currentPathCancels[id]) {
        this._currentPathCancels[id]();
        this._currentPathCancels[id] = undefined;
      }

      const initialPosAttr = target.getAttribute('data-initial-pos');
      let hasInitialPos = false;
      let startAnchor = null;
      if (startFromInitial && typeof initialPosAttr === 'string' && initialPosAttr.trim()) {
        const [sx, sy, sz] = initialPosAttr.trim().split(/\s+/);
        const ix = Number(sx);
        const iy = Number(sy);
        const iz = Number(sz);
        hasInitialPos = Number.isFinite(ix) && Number.isFinite(iy) && Number.isFinite(iz);
        if (hasInitialPos) {
          // 경로 재생은 항상 원위치(초기 position)부터 시작
          target.setAttribute('position', `${ix} ${iy} ${iz}`);
          startAnchor = { x: ix, y: iy, z: iz };
        }
      }

      const firstPoint = points[0] || {};
      const firstX = Number(firstPoint.x);
      const firstY = Number(firstPoint.y);
      const firstZ = Number(firstPoint.z);
      const hasValidFirstPoint =
        Number.isFinite(firstX) && Number.isFinite(firstY) && Number.isFinite(firstZ);

      // 초기 position 시작을 쓰지 않는 경우, 현재 위치를 시작 앵커로 사용
      if (!startFromInitial) {
        const currentPos = target.getAttribute('position');
        if (currentPos && typeof currentPos === 'object') {
          startAnchor = {
            x: Number(currentPos.x) || 0,
            y: Number(currentPos.y) || 0,
            z: Number(currentPos.z) || 0,
          };
        }
      }

      // 초기 position 정보가 없으면 경로 첫 점으로 폴백
      if (!startAnchor && hasValidFirstPoint) {
        target.setAttribute('position', `${firstX} ${firstY} ${firstZ}`);
        startAnchor = { x: firstX, y: firstY, z: firstZ };
      }

      const almostEqual = (a, b) => Math.abs(a - b) < 1e-6;
      const firstDuration = Number(firstPoint.durationMs);
      const firstIsMarkerPoint = startFromInitial && Number.isFinite(firstDuration) && firstDuration === 0;
      const firstEqualsAnchor =
        startFromInitial &&
        !!startAnchor &&
        hasValidFirstPoint &&
        almostEqual(firstX, startAnchor.x) &&
        almostEqual(firstY, startAnchor.y) &&
        almostEqual(firstZ, startAnchor.z);

      // 시작점 마커(0ms) 또는 앵커와 동일한 첫 점은 건너뛰고 실제 이동 구간부터 재생
      let index = firstIsMarkerPoint || firstEqualsAnchor ? 1 : 0;
      let currentFrom = startAnchor || target.getAttribute('position') || { x: 0, y: 0, z: 0 };

      const defaultDur =
        Number.isFinite(Number(durationPerSegment)) && Number(durationPerSegment) > 0
          ? Number(durationPerSegment)
          : 1000;

      const playNext = () => {
        if (index >= points.length) {
          if (this._currentPathCancels[id]) {
            this._currentPathCancels[id] = undefined;
          }
          window.dispatchEvent(
            new CustomEvent('drone-path-finished', { detail: { id } })
          );
          return;
        }

        const { x, y, z, durationMs } = points[index] || {};
        const from = `${currentFrom.x} ${currentFrom.y} ${currentFrom.z}`;
        const to = `${x} ${y} ${z}`;

        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          index += 1;
          playNext();
          return;
        }

        if (target.components['animation__path']) {
          target.removeAttribute('animation__path');
        }

        const onComplete = () => {
          target.removeEventListener('animationcomplete__path', onComplete);
          index += 1;
          playNext();
        };

        this._currentPathCancels[id] = () => {
          target.removeEventListener('animationcomplete__path', onComplete);
          target.removeAttribute('animation__path');
        };

        target.addEventListener('animationcomplete__path', onComplete);

        const parsedDuration = Number(durationMs);
        const hasDuration = Number.isFinite(parsedDuration) && parsedDuration >= 0;
        const segDur = hasDuration ? parsedDuration : defaultDur;

        // 0ms 구간은 즉시 이동으로 처리해 다음 구간 계산 오차를 줄인다.
        if (segDur === 0) {
          target.setAttribute('position', to);
          currentFrom = { x, y, z };
          target.removeEventListener('animationcomplete__path', onComplete);
          index += 1;
          playNext();
          return;
        }

        target.setAttribute('animation__path', {
          property: 'position',
          from,
          to,
          dur: segDur,
          easing: 'easeInOutQuad',
          loop: 0,
        });
        currentFrom = { x, y, z };
      };

      playNext();
    },
  });
}