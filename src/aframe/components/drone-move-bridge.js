import AFrame from '@skybrush/aframe-components';

if (!AFrame.components['drone-move-bridge']) {
  AFrame.registerComponent('drone-move-bridge', {
    init() {
      this._onMove = this._onMove.bind(this);
      this._onPath = this._onPath.bind(this);
      this._onInitialPosSet = this._onInitialPosSet.bind(this);
      this._onYawSet = this._onYawSet.bind(this);
      // 드론별로 경로 애니메이션 취소 함수를 따로 관리
      this._currentPathCancels = {};
      window.addEventListener('drone-move-request', this._onMove);
      window.addEventListener('drone-path-request', this._onPath);
      window.addEventListener('drone-initial-pos-set', this._onInitialPosSet);
      window.addEventListener('drone-yaw-set', this._onYawSet);
    },

    remove() {
      window.removeEventListener('drone-move-request', this._onMove);
      window.removeEventListener('drone-path-request', this._onPath);
      window.removeEventListener('drone-initial-pos-set', this._onInitialPosSet);
      window.removeEventListener('drone-yaw-set', this._onYawSet);

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

    _findDrone(id) {
      const sceneEl = this.el.sceneEl || this.el;
      return sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
    },

    _setYaw(target, yaw) {
      const parsed = Number(yaw);
      const fbxModel = target.components?.['fbx-model'];
      if (Number.isFinite(parsed)) {
        target.setAttribute('data-heading', String(parsed));
        if (typeof fbxModel?.setHeadingYaw === 'function') {
          fbxModel.setHeadingYaw(parsed);
        }
        return;
      }

      target.removeAttribute('data-heading');
      if (typeof fbxModel?.setHeadingYaw === 'function') {
        fbxModel.setHeadingYaw(null);
      }
    },

    _onMove(e) {
      const { id, x, y, z, yaw } = e.detail || {};
      if (!id) return;

      const target = this._findDrone(id);
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
      if (yaw !== undefined) {
        this._setYaw(target, yaw);
      }

      // 선택적으로: 패널 값 갱신용 이벤트
      window.dispatchEvent(
        new CustomEvent('drone-moved', { detail: { id, x, y, z } })
      );
    },

    _onYawSet(e) {
      const { id, yaw } = e.detail || {};
      if (!id) return;

      const target = this._findDrone(id);
      if (!target) {
        console.warn('[drone-move-bridge] yaw target not found:', id);
        return;
      }

      this._setYaw(target, yaw);
      window.dispatchEvent(
        new CustomEvent('drone-status-updated', { detail: { id, heading: yaw } })
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

      const firstPoint = points[0] || {};
      const firstX = Number(firstPoint.x);
      const firstY = Number(firstPoint.y);
      const firstZ = Number(firstPoint.z);
      const hasValidFirstPoint =
        Number.isFinite(firstX) && Number.isFinite(firstY) && Number.isFinite(firstZ);

      let startAnchor = null;
      let index = 0;
      // path[0]을 시작 위치로 사용할 때, 그 점의 durationMs/holdMs는 시작 후 대기 시간으로 사용한다.
      let initialWaitMs = 0;

      if (startFromInitial) {
        // 경로 재생은 path[0]을 곧 시작 위치로 사용한다.
        // path-planner 출력 컨벤션(첫 점 = 이륙/시작 지점)과 사용자의 직관적 기대에 맞춤.
        if (hasValidFirstPoint) {
          target.setAttribute('position', `${firstX} ${firstY} ${firstZ}`);
          startAnchor = { x: firstX, y: firstY, z: firstZ };
          index = 1;
          const firstDur = Number(firstPoint.durationMs);
          const firstHoldRaw = Number(firstPoint.holdMs);
          initialWaitMs =
            (Number.isFinite(firstDur) && firstDur > 0 ? firstDur : 0) +
            (Number.isFinite(firstHoldRaw) && firstHoldRaw > 0 ? firstHoldRaw : 0);
        } else if (typeof initialPosAttr === 'string' && initialPosAttr.trim()) {
          // 첫 점이 유효하지 않은 경우 fallback: data-initial-pos.
          const [sx, sy, sz] = initialPosAttr.trim().split(/\s+/);
          const ix = Number(sx);
          const iy = Number(sy);
          const iz = Number(sz);
          if (Number.isFinite(ix) && Number.isFinite(iy) && Number.isFinite(iz)) {
            target.setAttribute('position', `${ix} ${iy} ${iz}`);
            startAnchor = { x: ix, y: iy, z: iz };
          }
        }
      } else {
        // startFromInitial=false: 현재 위치에서 path[0]을 향해 애니메이션 (수동 단일 이동 등)
        const currentPos = target.getAttribute('position');
        if (currentPos && typeof currentPos === 'object') {
          startAnchor = {
            x: Number(currentPos.x) || 0,
            y: Number(currentPos.y) || 0,
            z: Number(currentPos.z) || 0,
          };
        }
        index = 0;
      }

      // 시작 앵커가 여전히 없으면 첫 점으로 최후 폴백
      if (!startAnchor && hasValidFirstPoint) {
        target.setAttribute('position', `${firstX} ${firstY} ${firstZ}`);
        startAnchor = { x: firstX, y: firstY, z: firstZ };
        index = 1;
      }

      let currentFrom = startAnchor || target.getAttribute('position') || { x: 0, y: 0, z: 0 };
      let currentHoldTimer = null;

      const defaultDur =
        Number.isFinite(Number(durationPerSegment)) && Number(durationPerSegment) > 0
          ? Number(durationPerSegment)
          : 1000;

      const toHoldMs = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      };

      const continueAfterHold = (point) => {
        const holdMs = toHoldMs(point?.holdMs);
        if (holdMs <= 0) {
          index += 1;
          playNext();
          return;
        }

        currentHoldTimer = window.setTimeout(() => {
          currentHoldTimer = null;
          index += 1;
          playNext();
        }, holdMs);
        this._currentPathCancels[id] = () => {
          if (currentHoldTimer) {
            window.clearTimeout(currentHoldTimer);
            currentHoldTimer = null;
          }
          target.removeAttribute('animation__path');
        };
      };

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

        const point = points[index] || {};
        const { x, y, z, durationMs } = point;
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
          continueAfterHold(point);
        };

        this._currentPathCancels[id] = () => {
          if (currentHoldTimer) {
            window.clearTimeout(currentHoldTimer);
            currentHoldTimer = null;
          }
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
          continueAfterHold(point);
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

      // path[0]을 시작 위치로 사용한 경우, path[0]의 durationMs/holdMs 합계를 시작 후 대기 시간으로 사용
      if (index > 0 && initialWaitMs > 0) {
        currentHoldTimer = window.setTimeout(() => {
          currentHoldTimer = null;
          playNext();
        }, initialWaitMs);
        this._currentPathCancels[id] = () => {
          if (currentHoldTimer) {
            window.clearTimeout(currentHoldTimer);
            currentHoldTimer = null;
          }
          target.removeAttribute('animation__path');
        };
      } else {
        playNext();
      }
    },
  });
}