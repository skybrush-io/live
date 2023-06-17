import { uavIdToDOMNodeId } from '~/views/uavs/utils';

/**
 * Scrolls the first element matching the given CSS selector,
 * or the given element into view.
 */
export function scrollIntoView(target: string | HTMLElement): void {
  const element =
    typeof target === 'string' ? document.querySelector(target) : target;

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
export function scrollUAVListItemIntoView(uavId: string): void {
  const domNodeId = uavIdToDOMNodeId(uavId);
  if (domNodeId) {
    scrollIntoView(`#${domNodeId}`);
  }
}
