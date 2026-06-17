/**
 * A-Frame component that renders the LED show (from the LED editor) as a grid of
 * glowing tiles in the 3D scene and animates their colours in real time from the
 * shared playhead in the Redux store.
 *
 * It manages a single THREE.Group of small unlit (MeshBasic) planes — one per
 * LED — so colours can be updated every frame cheaply. The grid is rebuilt only
 * when the formation (rows × cols), drone count or LEDs-per-drone changes.
 */

import AFrame from '@skybrush/aframe-components';

import { computePlaybackFrame } from '~/features/led-editor/utils';
import store from '~/store';

// Use A-Frame's bundled THREE so objects pass its `instanceof` checks
// (a separately-imported `three` would be a different module instance).
const { THREE } = AFrame;

const OFF_COLOR = 0x070707;
const BG_COLOR = 0x020202;

AFrame.registerComponent('led-show-grid', {
  schema: {
    cell: { type: 'number', default: 0.12 }, // LED size, metres
    gap: { type: 'number', default: 0.04 }, // gap between LEDs within a drone
    droneGap: { type: 'number', default: 0.22 }, // gap between drone blocks
    elevation: { type: 'number', default: 1.0 }, // panel bottom above origin
  },

  init() {
    this.grid = new THREE.Group();
    this.el.setObject3D('ledgrid', this.grid);
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.ledRefs = [];
    this.background = null;
    this.sig = '';
    this._color = new THREE.Color();
  },

  remove() {
    this._dispose();
    this.el.removeObject3D('ledgrid');
    this.geometry.dispose();
  },

  _dispose() {
    for (const ref of this.ledRefs) {
      ref.material.dispose();
    }
    this.ledRefs = [];
    if (this.background) {
      this.background.geometry.dispose();
      this.background.material.dispose();
      this.background = null;
    }
    while (this.grid.children.length > 0) {
      this.grid.remove(this.grid.children[0]);
    }
  },

  _rebuild(rows, cols, droneCount, leds) {
    this._dispose();
    const { cell, gap, droneGap, elevation } = this.data;
    const ledStride = cell + gap;
    const blockSize = leds * cell + (leds - 1) * gap;
    const droneStride = blockSize + droneGap;
    const totalW = cols * droneStride - droneGap;
    const totalH = rows * droneStride - droneGap;
    const cy = elevation + totalH / 2;

    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(totalW + droneGap, totalH + droneGap),
      new THREE.MeshBasicMaterial({ color: BG_COLOR, side: THREE.DoubleSide })
    );
    bg.position.set(0, cy, -cell * 0.25);
    this.grid.add(bg);
    this.background = bg;

    for (let d = 0; d < droneCount; d++) {
      const droneRow = Math.floor(d / cols);
      const droneCol = d % cols;
      const blockX0 = droneCol * droneStride;
      const blockY0 = droneRow * droneStride;
      for (let local = 0; local < leds * leds; local++) {
        const lx = local % leds;
        const ly = Math.floor(local / leds);
        const x = blockX0 + lx * ledStride + cell / 2;
        const y = blockY0 + ly * ledStride + cell / 2;
        const material = new THREE.MeshBasicMaterial({
          color: OFF_COLOR,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.scale.set(cell, cell, 1);
        // Centre horizontally; flip Y so drone row 0 is at the top; elevate.
        mesh.position.set(x - totalW / 2, cy + (totalH / 2 - y), 0);
        this.grid.add(mesh);
        this.ledRefs.push({ drone: d, local, material });
      }
    }
    this.sig = `${rows}|${cols}|${droneCount}|${leds}`;
  },

  tick() {
    const led = store.getState().ledEditor;
    if (!led) {
      return;
    }
    const { boards, droneCount, ledsPerDrone, playheadSec } = led;
    const hasShow = Array.isArray(boards) && boards.length > 0;
    this.grid.visible = hasShow;
    if (!hasShow) {
      return;
    }

    const frame = computePlaybackFrame(
      boards,
      droneCount,
      ledsPerDrone,
      playheadSec
    );
    const sig = `${frame.rows}|${frame.cols}|${droneCount}|${ledsPerDrone}`;
    if (sig !== this.sig) {
      this._rebuild(frame.rows, frame.cols, droneCount, ledsPerDrone);
    }

    const drones = frame.drones;
    for (const ref of this.ledRefs) {
      const pixel = drones && drones[ref.drone] ? drones[ref.drone][ref.local] : undefined;
      if (pixel && (pixel[0] || pixel[1] || pixel[2])) {
        ref.material.color.setRGB(pixel[0] / 255, pixel[1] / 255, pixel[2] / 255);
      } else {
        ref.material.color.setHex(OFF_COLOR);
      }
    }
  },
});
