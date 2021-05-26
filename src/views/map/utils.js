import copy from 'copy-to-clipboard';

/**
 * Copies the currently displayed coordinates from the "mouse position" box
 * (overlaid on top of the map) to the clipboard.
 *
 * @returns {bool} true if the coordinates were copied successfully, false if
 *          the box is not visible
 */
export function copyDisplayedCoordinatesToClipboard() {
  const displays = document.querySelectorAll('.ol-mouse-position');
  const firstDisplay =
    displays && displays.length > 0 ? displays[0] : undefined;
  const textNodes = firstDisplay
    ? Array.from(firstDisplay.childNodes).filter(
        (node) => node.nodeType === Node.TEXT_NODE
      )
    : [];
  const text =
    textNodes && textNodes.length > 0 ? textNodes[0].textContent : undefined;

  if (text) {
    copy(text.split('\n')[0]);
    return true;
  } else {
    return false;
  }
}
