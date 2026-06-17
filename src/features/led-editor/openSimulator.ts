/**
 * @file Helper to open (or focus, if already open) the LED Simulation panel in
 * the workbench — used by the "View in Simulator" button in the editor.
 */

import workbench from '~/workbench';

export function openLedSimulator(): void {
  let existing: unknown;
  // The workbench iterates its content items (views); find an open simulator.
  (workbench as { forEach: (cb: (view: any) => void) => void }).forEach(
    (view: any) => {
      if (view?.isComponent && view?.config?.component === 'led-simulation') {
        existing = view;
      }
    }
  );

  if (existing) {
    workbench.bringToFront(existing as never);
  } else {
    workbench.addNewItem('led-simulation');
  }
}
