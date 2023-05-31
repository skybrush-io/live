import { uavIdToDOMNodeId } from '~/views/uavs/utils';

/**
 * Scrolls the first element matching the given CSS selector into view.
 */
export function scrollIntoView(selector) {
  const element =
    typeof selector === 'string'
      ? document.querySelector(selector)
      : element.scrollIntoView
      ? element
      : null;
  if (element) {
    window.requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest',
      });
    });
  }
}

/**
 * Scrolls the element showing the data of the UAV with the given ID into
 * view.
 */
export function scrollUAVListItemIntoView(uavId) {
  const domNodeId = uavIdToDOMNodeId(uavId);
  if (domNodeId) {
    return scrollIntoView(`#${domNodeId}`);
  }
}
