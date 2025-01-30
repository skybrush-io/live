import * as copy from 'copy-to-clipboard';

/**
 * Copies the currently displayed coordinates from the "mouse position" box
 * (overlaid on top of the map) to the clipboard.
 *
 * @returns True if the coordinates were copied successfully,
 *          false if the box is not visible
 */
export function copyDisplayedCoordinatesToClipboard(): boolean {
  const display = document.querySelector('.ol-mouse-position');
  const textNodes = display
    ? [...display.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
    : [];
  const text = textNodes[0]?.textContent;

  if (text) {
    copy(text);
    return true;
  } else {
    return false;
  }
}
