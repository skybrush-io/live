import AFrame from '@skybrush/aframe-components';

if (!AFrame.components['drone-move-bridge']) {
  AFrame.registerComponent('drone-move-bridge', {
    init() {
      this._onMove = this._onMove.bind(this);
      this._onPath = this._onPath.bind(this);
      // 드론별로 경로 애니메이션 취소 함수를 따로 관리
      this._currentPathCancels = {};
      window.addEventListener('drone-move-request', this._onMove);
      window.addEventListener('drone-path-request', this._onPath);
    },

    remove() {
      window.removeEventListener('drone-move-request', this._onMove);
      window.removeEventListener('drone-path-request', this._onPath);

      if (this._currentPathCancels) {
        Object.values(this._currentPathCancels).forEach((cancel) => {
          try {
            cancel();
          } catch (e) {
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

      // 단일 이동은 즉시 위치 변경
      target.setAttribute('position', `${x} ${y} ${z}`);

      // 선택적으로: 패널 값 갱신용 이벤트
      window.dispatchEvent(
        new CustomEvent('drone-moved', { detail: { id, x, y, z } })
      );
    },

    _onPath(e) {
      const { id, points, durationPerSegment = 1000 } = e.detail || {};
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
        delete this._currentPathCancels[id];
      }

      let index = 0;

      const defaultDur =
        Number.isFinite(Number(durationPerSegment)) && Number(durationPerSegment) > 0
          ? Number(durationPerSegment)
          : 1000;

      const playNext = () => {
        if (index >= points.length) {
          if (this._currentPathCancels[id]) {
            delete this._currentPathCancels[id];
          }
          window.dispatchEvent(
            new CustomEvent('drone-path-finished', { detail: { id } })
          );
          return;
        }

        const currentPos = target.getAttribute('position') || { x: 0, y: 0, z: 0 };
        const { x, y, z, durationMs } = points[index] || {};
        const from = `${currentPos.x} ${currentPos.y} ${currentPos.z}`;
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

        const segDur =
          Number.isFinite(Number(durationMs)) && Number(durationMs) > 0
            ? Number(durationMs)
            : defaultDur;

        target.setAttribute('animation__path', {
          property: 'position',
          from,
          to,
          dur: segDur,
          easing: 'easeInOutQuad',
          loop: 0,
        });
      };

      playNext();
    },
  });
}