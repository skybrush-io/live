/**
 * Formats a mission-specific ID in a consistent manner that is to be used
 * everywhere throughout the UI.
 */
export function formatMissionId(index) {
  return `s${index + 1}`;
}
