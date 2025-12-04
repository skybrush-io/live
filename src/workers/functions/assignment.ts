import { getDistance as haversineDistance } from 'ol/sphere';

import {
  findAssignmentBetweenPoints,
  type Assignment,
  type GreedyMatchingOptions,
} from '~/algorithms/matching';
import type { LonLat } from '~/utils/geography';
import { euclideanDistance2D } from '~/utils/math';

export type DistanceMetric = 'euclidean' | 'geodetic';

function findGreedyEuclideanAssignment(
  sources: Array<[number, number]>,
  targets: Array<[number, number]>,
  options: GreedyMatchingOptions
): Assignment {
  return findAssignmentBetweenPoints(sources, targets, {
    distanceFunction: euclideanDistance2D,
    matching: {
      algorithm: 'greedy',
      ...options,
    },
  });
}

function findGreedyGeodeticAssignment(
  sources: LonLat[],
  targets: LonLat[],
  options: GreedyMatchingOptions
): Assignment {
  return findAssignmentBetweenPoints(sources, targets, {
    distanceFunction: haversineDistance,
    matching: {
      algorithm: 'greedy',
      ...options,
    },
  });
}

export default function findGreedyAssignment(
  sources: Array<[number, number]>,
  targets: Array<[number, number]>,
  options: GreedyMatchingOptions & { distanceMetric: DistanceMetric }
): Assignment {
  switch (options.distanceMetric) {
    case 'euclidean':
      return findGreedyEuclideanAssignment(sources, targets, options);
    case 'geodetic':
      return findGreedyGeodeticAssignment(
        sources as LonLat[],
        targets as LonLat[],
        options
      );
    default:
      throw new Error(`Unknown distance metric: ${options.distanceMetric}`);
  }
}
