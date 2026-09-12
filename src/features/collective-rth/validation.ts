import type { CollectiveRTHParameters } from '~/flockwave/types';

/**
 * Returns whether the given collective RTH plan calculation parameters are
 * valid.
 */
export function areCollectiveRTHParametersValid(
  params: CollectiveRTHParameters
): boolean {
  return (
    params.minDistance >= 0 &&
    params.timeResolution >= 1 &&
    Number.isInteger(params.timeResolution) &&
    params.horizontalVelocity > 0 &&
    params.verticalVelocity > 0
  );
}
