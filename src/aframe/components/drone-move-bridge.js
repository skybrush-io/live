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
      this._currentYawAnimationFrames = {};
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

      if (this._currentYawAnimationFrames) {
        Object.values(this._currentYawAnimationFrames).forEach((frameId) => {
          if (frameId) window.cancelAnimationFrame(frameId);
        });
        this._currentYawAnimationFrames = {};
      }
    },

    _findDrone(id) {
      const sceneEl = this.el.sceneEl || this.el;
      return sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
    },

    _setYaw(target, yaw) {
      const parsed = Number(yaw);
      if (Number.isFinite(parsed)) {
        target.setAttribute('data-heading', String(parsed));
        // Yaw on the root entity only (show Z / vertical axis). Model pitch stays on child.
        target.setAttribute('rotation', `0 0 ${parsed}`);
        return;
      }

      target.removeAttribute('data-heading');
      target.setAttribute('rotation', '0 0 0');
    },

    _getCurrentYaw(target) {
      const parsed = Number(target?.getAttribute?.('data-heading'));
      return Number.isFinite(parsed) ? parsed : null;
    },

    _getPointYaw(point) {
      const parsed = Number(point?.yaw);
      return Number.isFinite(parsed) ? parsed : null;
    },

    _normalizeYawDelta(delta) {
      let result = delta;
      while (result > 180) result -= 360;
      while (result < -180) result += 360;
      return result;
    },

    _easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
    },

    _cancelYawAnimation(id) {
      const frameId = this._currentYawAnimationFrames?.[id];
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        this._currentYawAnimationFrames[id] = undefined;
      }
    },

    _animateYaw(id, target, fromYaw, toYaw, durationMs) {
      if (!Number.isFinite(toYaw)) return;

      this._cancelYawAnimation(id);

      const startYaw = Number.isFinite(fromYaw) ? fromYaw : toYaw;
      const duration = Math.max(0, Number(durationMs) || 0);
      if (duration <= 0 || startYaw === toYaw) {
        this._setYaw(target, toYaw);
        return;
      }

      const startedAt = performance.now();
      const delta = this._normalizeYawDelta(toYaw - startYaw);

      const step = (now) => {
        const ratio = Math.min(1, Math.max(0, (now - startedAt) / duration));
        const eased = this._easeInOutQuad(ratio);
        this._setYaw(target, startYaw + delta * eased);

        if (ratio < 1) {
          this._currentYawAnimationFrames[id] = window.requestAnimationFrame(step);
        } else {
          this._currentYawAnimationFrames[id] = undefined;
          this._setYaw(target, toYaw);
        }
      };

      this._currentYawAnimationFrames[id] = window.requestAnimationFrame(step);
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
      this._cancelYawAnimation(id);

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
      let currentYaw = this._getCurrentYaw(target);

      if (startFromInitial) {
        // 경로 재생은 path[0]을 곧 시작 위치로 사용한다.
        // path-planner 출력 컨벤션(첫 점 = 이륙/시작 지점)과 사용자의 직관적 기대에 맞춤.
        if (hasValidFirstPoint) {
          target.setAttribute('position', `${firstX} ${firstY} ${firstZ}`);
          const firstYaw = this._getPointYaw(firstPoint);
          if (firstYaw != null) {
            this._setYaw(target, firstYaw);
            currentYaw = firstYaw;
          }
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
        const firstYaw = this._getPointYaw(firstPoint);
        if (firstYaw != null) {
          this._setYaw(target, firstYaw);
          currentYaw = firstYaw;
        }
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
          this._cancelYawAnimation(id);
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
        const targetYaw = this._getPointYaw(point);
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

        const parsedDuration = Number(durationMs);
        const hasDuration = Number.isFinite(parsedDuration) && parsedDuration >= 0;
        const segDur = hasDuration ? parsedDuration : defaultDur;
        const isStationarySegment =
          Math.abs(currentFrom.x - x) < 1e-6 &&
          Math.abs(currentFrom.y - y) < 1e-6 &&
          Math.abs(currentFrom.z - z) < 1e-6;

        // 0ms 구간은 즉시 이동으로 처리해 다음 구간 계산 오차를 줄인다.
        if (segDur === 0) {
          target.setAttribute('position', to);
          currentFrom = { x, y, z };
          if (targetYaw != null) {
            this._setYaw(target, targetYaw);
            currentYaw = targetYaw;
          }
          continueAfterHold(point);
          return;
        }

        // 위치 변화 없이 yaw만 바뀌는 구간: A-Frame position 애니메이션은 즉시 끝나므로 타이머로 재생
        if (isStationarySegment) {
          if (targetYaw != null) {
            this._animateYaw(id, target, currentYaw, targetYaw, segDur);
          }

          currentHoldTimer = window.setTimeout(() => {
            currentHoldTimer = null;
            if (targetYaw != null) {
              this._cancelYawAnimation(id);
              this._setYaw(target, targetYaw);
              currentYaw = targetYaw;
            }
            continueAfterHold(point);
          }, segDur);

          this._currentPathCancels[id] = () => {
            if (currentHoldTimer) {
              window.clearTimeout(currentHoldTimer);
              currentHoldTimer = null;
            }
            this._cancelYawAnimation(id);
          };
          currentFrom = { x, y, z };
          return;
        }

        const onComplete = () => {
          target.removeEventListener('animationcomplete__path', onComplete);
          if (targetYaw != null) {
            this._cancelYawAnimation(id);
            this._setYaw(target, targetYaw);
            currentYaw = targetYaw;
          }
          continueAfterHold(point);
        };

        this._currentPathCancels[id] = () => {
          if (currentHoldTimer) {
            window.clearTimeout(currentHoldTimer);
            currentHoldTimer = null;
          }
          target.removeEventListener('animationcomplete__path', onComplete);
          target.removeAttribute('animation__path');
          this._cancelYawAnimation(id);
        };

        target.addEventListener('animationcomplete__path', onComplete);

        if (targetYaw != null) {
          this._animateYaw(id, target, currentYaw, targetYaw, segDur);
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
          this._cancelYawAnimation(id);
        };
      } else {
        playNext();
      }
    },
  });
}