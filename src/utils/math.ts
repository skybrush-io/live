import {
  closePolygon,
  isVector2Tuple,
  type Vector2,
  type Vector2PlusTuple,
  type Vector2Tuple,
  type Vector3Tuple,
} from '@skybrush/math';

import * as TurfHelpers from '@turf/helpers';
import type { LineString, Point, Polygon } from 'geojson';
import { err, ok, type Result } from 'neverthrow';

import type { LonLat } from './geography';

// Legacy alias of Vector2Tuple.
//
// Coordinate2D was renamed to Vector2Tuple for consistency with
// Three.js and `@skybrush/show-format`
export type Coordinate2D = Vector2Tuple;

// Legacy alias of Vector2PlusTuple.
//
// Coordinate2DPlus was renamed to Vector2Tuple for consistency with
// Three.js and `@skybrush/show-format`
export type Coordinate2DPlus = Vector2PlusTuple;

// Legacy alias of Vector3Tuple.
//
// Coordinate3D was renamed to Vector2Tuple for consistency with
// Three.js and `@skybrush/show-format`
export type Coordinate3D = Vector3Tuple;

// Legacy alias of Vector2.
//
// Coordinate3D was renamed to Vector2 for consistency with
// Three.js and `@skybrush/show-format`
export type Coordinate2DObject = Vector2;

/**
 * Type guard for checking whether the input is a valid 2D coordinate pair.
 *
 * Legacy alias of `isVector2Tuple` for consistency with previous versions of the
 * codebase.
 */
export const isCoordinate2D = isVector2Tuple;

/**
 * Creates an appropriate Turf.js geometry from the given list of coordinates.
 *
 * When no coordinates are provided, the result is undefined. When a single
 * coordinate is provided, a point geometry is returned. When two coordinates
 * are provided, a linestring geometry is returned with two points. When three
 * or more coordinates are provided, the result will be a Turf.js polygon.
 */
export function createGeometryFromPoints(
  coordinates: LonLat[]
): Result<Point | LineString | Polygon, string> {
  if (coordinates.length === 0) {
    return err('at least one point is required to create a geometry');
  }

  if (coordinates.length === 1 && isCoordinate2D(coordinates[0])) {
    return ok(TurfHelpers.point(coordinates[0]).geometry);
  }

  if (coordinates.length === 2) {
    return ok(TurfHelpers.lineString(coordinates).geometry);
  }

  const closedPoly = [...coordinates];
  closePolygon(closedPoly);

  return ok(TurfHelpers.polygon([closedPoly]).geometry);
}
