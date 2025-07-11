import minBy from 'lodash-es/minBy';
import range from 'lodash-es/range';
import hash from 'hash.js';

import { err, ok, type Result } from 'neverthrow';

import { circularGet, circularSet, maxWith, minWith } from './arrays';
import { bufferPolygon, type EasNor, type LonLat } from './geography';
import {
  areaOfTriangle2D,
  type Coordinate2D,
  dotProduct2D,
  getNormal2D,
  isCoordinate2D,
  toDegrees,
} from './math';
import { type Tuple } from './types';
import { ReadonlyTuple } from 'type-fest';

// TODO: TurnAngle has three parameters, remove...Vertex functions have one tuple...

type PolygonCoordinates = [
  Coordinate2D,
  Coordinate2D,
  Coordinate2D,
  ...Coordinate2D[],
];

// enum Orientation {
//   CLOCKWISE = 'clockwise',
//   COUNTERCLOCKWISE = 'counterclockwise',
// }

// -1: Clockwise | 0: Undefined | 1: Counterclockwise
type Orientation = number;

enum VertexCurvature {
  CONVEX = 'convex',
  CONCAVE = 'concave',
}

const arePolygonCoordinates = (
  coordinates: Coordinate2D[]
): coordinates is PolygonCoordinates => coordinates.length >= 3;

type VertexData = {
  position: Coordinate2D;
  curvature?: VertexCurvature;
  removalCost?: number;
};

// TODO: Use a priority queue for keeping vertices sorted by removal cost.
class MutablePolygon {
  vertices: VertexData[];
  #orientation: Orientation;

  constructor(coordinates: PolygonCoordinates) {
    // if (coordinates.length < 3) {
    //   throw new Error('polygons need to have at least three 2D vertices');
    // }
    // const curvatures =

    // this.coordinates = structuredClone(coordinates);
    this.vertices = coordinates.map((position) => ({
      position,
      // curvature: getCurvature(),
      // removalCost: getRemovalCost(),
      // curvature: undefined,
      // removalCost: undefined,
    }));

    this.#orientation = getPolygonOrientation(this);
    this.recalculateCurvatures();
    this.recalculateRemovalCosts();

    // console.log(this.#orientation);
  }

  get coordinates(): Coordinate2D[] {
    return this.vertices.map((v) => v.position);
  }

  recalculateCurvature = (index: number): void => {
    this.getVertex(index).curvature =
      Math.sign(turnAngle(...this.getVertexPositions(index, [-1, 0, 1]))) ===
      this.#orientation
        ? VertexCurvature.CONVEX
        : VertexCurvature.CONCAVE;
  };

  recalculateCurvatures = (): void => {
    this.vertices.forEach((v, i) => {
      if (v.curvature === undefined) {
        this.recalculateCurvature(i);
      }
    });
  };

  recalculateRemovalCost = (index: number): void => {
    const vertex = this.getVertex(index);

    switch (vertex.curvature) {
      case VertexCurvature.CONVEX:
        if (
          this.getVertices(index, [-1, 0, 1]).every(
            (v) => v.curvature === VertexCurvature.CONVEX
          )
        ) {
          vertex.removalCost = removeConvexVertex(
            this.getVertexPositions(index, [-2, -1, 0, 1, 2])
          ).cost;
        } else {
          vertex.removalCost = Number.POSITIVE_INFINITY;
        }

        break;

      case VertexCurvature.CONCAVE:
        vertex.removalCost = removeConcaveVertex(
          this.getVertexPositions(index, [-1, 0, 1])
        ).cost;
        break;

      default:
        vertex.removalCost = Number.POSITIVE_INFINITY;
        break;
    }
  };

  recalculateRemovalCosts = (): void => {
    this.vertices.forEach((v, i) => {
      if (v.removalCost === undefined) {
        this.recalculateRemovalCost(i);
      }
    });
  };

  getVertex(i: number): VertexData {
    // NOTE: Bang justified by `coordinates.length >= 3`
    return circularGet(this.vertices, i)!;
  }

  // NOTE: We shouldn't need to define these overloads, but otherwise we get
  //       errors like the following: "A spread argument must either have a
  //       tuple type or be passed to a rest parameter. [2556]"
  getVertices(i: number, offsets: Tuple<number, 3>): Tuple<VertexData, 3>;
  getVertices(i: number, offsets: Tuple<number, 5>): Tuple<VertexData, 5>;
  getVertices(i: number, offsets: number[]): VertexData[] {
    return offsets.map((o) => this.getVertex(i + o));
  }

  setVertex(i: number, v: VertexData): void {
    circularSet(this.vertices, i, v);
  }

  getVertexPosition(i: number): Coordinate2D {
    return this.getVertex(i).position;
  }

  // NOTE: We shouldn't need to define these overloads, but otherwise we get
  //       errors like the following: "A spread argument must either have a
  //       tuple type or be passed to a rest parameter. [2556]"
  getVertexPositions(
    i: number,
    offsets: Tuple<number, 3>
  ): Tuple<Coordinate2D, 3>;
  getVertexPositions(
    i: number,
    offsets: Tuple<number, 5>
  ): Tuple<Coordinate2D, 5>;
  getVertexPositions(i: number, offsets: number[]): Coordinate2D[] {
    return offsets.map((o) => this.getVertex(i + o).position);
  }

  setVertexPosition(i: number, position: Coordinate2D): void {
    this.setVertex(i, { position });
  }
}

// /**
//  * Calculate the amount of rotation at the corner formed by the three points.
//  *
//  * @returns Signed angle in the (-180°, 180°] range
//  */
// const turnAngle = (
//   a: Coordinate2D,
//   b: Coordinate2D,
//   c: Coordinate2D
// ): number => {
//   // const u: Coordinate2D = [b[0] - a[0], b[1] - a[1]];
//   // const v: Coordinate2D = [c[0] - b[0], c[1] - b[1]];
//   //
//   // return Math.acos(dotProduct2D(u, v) / (length2D(u) * length2D(v)));
//
//   const u: Coordinate2D = [b[0] - a[0], b[1] - a[1]];
//   const v: Coordinate2D = [c[0] - b[0], c[1] - b[1]];
//
//   const r = Math.atan2(v[1], v[0]) - Math.atan2(u[1], u[0]);
//   return r <= -Math.PI ? r + 2 * Math.PI : r > Math.PI ? r - 2 * Math.PI : r;
//   // console.log({ a, b, c, u, v, r, d: toDegrees(r) });
// };

/**
 * Calculate the amount of rotation at the corner formed by the three points.
 *
 * @returns Signed angle in radians normalized to the (-π, π] range
 */
const turnAngle = (
  [ax, ay]: Coordinate2D,
  [bx, by]: Coordinate2D,
  [cx, cy]: Coordinate2D
): number => {
  // const u: Coordinate2D = [b[0] - a[0], b[1] - a[1]];
  // const v: Coordinate2D = [c[0] - b[0], c[1] - b[1]];
  //
  // return Math.acos(dotProduct2D(u, v) / (length2D(u) * length2D(v)));

  const [ux, uy]: Coordinate2D = [bx - ax, by - ay];
  const [vx, vy]: Coordinate2D = [cx - bx, cy - by];

  const r = Math.atan2(vy, vx) - Math.atan2(uy, ux);
  // console.log(
  //   `DegAB=${toDegrees(Math.atan2(uy, ux))}|DegBC=${toDegrees(Math.atan2(vy, vx))}`
  // );
  return r <= -Math.PI ? r + 2 * Math.PI : r > Math.PI ? r - 2 * Math.PI : r;
};

// TODO: Use `@turf/boolean-clockwise` instead?
//       https://www.npmjs.com/package/@turf/boolean-clockwise
//
// const getPolygonOrientation = <C extends Coordinate2D | EasNor | LonLat>(
// https://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
const getPolygonOrientation = (polygon: MutablePolygon): Orientation => {
  const extremeCoordinate = minWith(
    polygon.coordinates,
    ([ax, ay], [bx, by]) => (ax === ay ? ay - by : ax - bx)
  );
  const extremeCoordinateIndex = polygon.coordinates.indexOf(extremeCoordinate);

  // turnAngle(
  //   polygon.getVertex(extremeCoordinateIndex - 1),
  //   polygon.getVertex(extremeCoordinateIndex),
  //   polygon.getVertex(extremeCoordinateIndex + 1)
  // );

  // console.log(
  //   'turnAngle',
  //   { extremeCoordinateIndex, extremeCoordinate },
  //   toDegrees(
  //     turnAngle(
  //       ...polygon.getVertexPositions(extremeCoordinateIndex, [-1, 0, 1])
  //     )
  //   )
  // );

  return Math.sign(
    turnAngle(...polygon.getVertexPositions(extremeCoordinateIndex, [-1, 0, 1]))
  );
};

/**
 * Given five vertices, remove the middle one (c) and move the second (b) and
 * fourth (d) in a way that the original area is still covered.
 * The transformation essentially slides (b) along the (ab) line and (d) along
 * the (ed) line extending them until the new (bd) line "touches" (c).
 */
const removeConvexVertex = ([a, b, c, d, e]: Tuple<Coordinate2D, 5>): {
  result: Tuple<Coordinate2D, 4>;
  cost: number;
} => {
  const leftNormal = getNormal2D(a, b);
  const centerNormal = getNormal2D(b, d);
  const rightNormal = getNormal2D(d, e);

  const leftConstant = dotProduct2D(leftNormal, a);
  const centerConstant = dotProduct2D(centerNormal, c);
  const rightConstant = dotProduct2D(rightNormal, e);

  // lNx lNy [ nBx ] = lC
  // cNx cNy [ nBy ] = cC

  const determinantLeft =
    leftNormal[0] * centerNormal[1] - leftNormal[1] * centerNormal[0];

  const determinantRight =
    rightNormal[0] * centerNormal[1] - rightNormal[1] * centerNormal[0];

  // nBx =  cNy -lNy [ lC ]
  // nBy = -cNx  lNx [ cC ]

  const newB: Coordinate2D = [
    (centerNormal[1] * leftConstant - leftNormal[1] * centerConstant) /
      determinantLeft,
    (-centerNormal[0] * leftConstant + leftNormal[0] * centerConstant) /
      determinantLeft,
  ];

  const newD: Coordinate2D = [
    (centerNormal[1] * rightConstant - rightNormal[1] * centerConstant) /
      determinantRight,
    (-centerNormal[0] * rightConstant + rightNormal[0] * centerConstant) /
      determinantRight,
  ];

  return {
    result: [a, newB, newD, e],
    cost: areaOfTriangle2D(b, newB, c) + areaOfTriangle2D(d, newD, c),
  };
};

const removeConcaveVertex = ([a, b, c]: Tuple<Coordinate2D, 3>): {
  result: Tuple<Coordinate2D, 2>;
  cost: number;
} => ({ result: [a, c], cost: areaOfTriangle2D(a, b, c) });

const applyConvexVertexRemoval = (
  mutablePolygon: MutablePolygon,
  i: number
): void => {
  const {
    result: [a, newB, newD, e],
  } = removeConvexVertex(
    mutablePolygon.getVertexPositions(i, [-2, -1, 0, 1, 2])
  );

  // Position didn't change, but curvature and removal cost needs recalculation
  mutablePolygon.setVertexPosition(i - 2, a);
  mutablePolygon.setVertexPosition(i - 1, newB);
  mutablePolygon.setVertexPosition(i + 1, newD);
  // Position didn't change, but curvature and removal cost needs recalculation
  mutablePolygon.setVertexPosition(i + 2, e);

  mutablePolygon.vertices.splice(i, 1);
};

const applyConcaveVertexRemoval = (
  mutablePolygon: MutablePolygon,
  i: number
): void => {
  const {
    result: [a, c],
  } = removeConcaveVertex(mutablePolygon.getVertexPositions(i, [-1, 0, 1]));

  // Position didn't change, but curvature and removal cost needs recalculation
  mutablePolygon.setVertexPosition(i - 1, a);
  // Position didn't change, but curvature and removal cost needs recalculation
  mutablePolygon.setVertexPosition(i + 1, c);

  mutablePolygon.vertices.splice(i, 1);
};

const simplificationCache: Record<string, Coordinate2D[]> = {};

/**
 * Simplify a mutable polygon by continously removing the vertices with the
 * lowest removal cost and adjusting their neighbors until a desired limit.
 */
export const simplifyPolygonUntilLimit = (
  mutablePolygon: MutablePolygon,
  limit: number
): void => {
  const cacheKey = hash
    .sha1()
    .update(JSON.stringify(mutablePolygon.coordinates))
    .digest('hex');

  if (`${cacheKey}|${limit}` in simplificationCache) {
    mutablePolygon.vertices = simplificationCache[`${cacheKey}|${limit}`]!.map(
      (position) => ({ position })
    );
    return;
  }

  // console.log({ mutablePolygon });
  // console.log(structuredClone(mutablePolygon.vertices));

  while (mutablePolygon.vertices.length > limit) {
    // TODO: Justify bang?
    const minCostVertex = minBy(mutablePolygon.vertices, (v) => v.removalCost)!;
    const minCostVertexIndex = mutablePolygon.vertices.indexOf(minCostVertex);

    switch (minCostVertex.curvature) {
      case VertexCurvature.CONVEX:
        applyConvexVertexRemoval(mutablePolygon, minCostVertexIndex);
        break;

      case VertexCurvature.CONCAVE:
        applyConcaveVertexRemoval(mutablePolygon, minCostVertexIndex);
        break;

      default:
        console.error('minCostVertex without known curvature');
        break;
    }

    mutablePolygon.recalculateCurvatures();
    mutablePolygon.recalculateRemovalCosts();

    if (mutablePolygon.vertices.length <= 70) {
      simplificationCache[`${cacheKey}|${mutablePolygon.vertices.length}`] =
        structuredClone(mutablePolygon.coordinates);
    }
  }

  // if (limit % 2 === 0) {
  //   applyConvexVertexRemoval(mutablePolygon, 0);
  // } else {
  //   applyConcaveVertexRemoval(mutablePolygon, 0);
  // }
};

/**
 * Simplify a polygon given by its list of coordinates by continously removing
 * the vertices with the lowest surrounding turning rotations (equivalently, the
 * highest surrounding internal angles) and adjusting their neighbors until a
 * desired limit is reached.
 */
// export const simplifyPolygonUntilLimit_ = (
//   coordinates: Coordinate2D[],
//   limit: number
// ): Coordinate2D[] => {
//   if (coordinates.length <= limit) {
//     return coordinates;
//   }
//
//   const getAngleAt = (i: number): number =>
//     // NOTE: Bangs justified by return if `coordinates.length <= 3`
//     turnAngle(
//       circularGet(coordinates, i - 1)!,
//       circularGet(coordinates, i)!,
//       circularGet(coordinates, i + 1)!
//     );
//
//   console.log(coordinates.map((_, i) => `${i}: ${getAngleAt(i)}`));
//   // console.log(getAngleAt(minAnglePosition));
//
//   // NOTE: Bang justified by return if `coordinates.length <= 3`
//   const minAnglePosition = minBy(range(coordinates.length), getAngleAt)!;
//   // NOTE: Bangs justified by return if `coordinates.length <= 3`
//   const { result: updated } = removeConvexVertex([
//     circularGet(coordinates, minAnglePosition - 2)!,
//     circularGet(coordinates, minAnglePosition - 1)!,
//     circularGet(coordinates, minAnglePosition)!,
//     circularGet(coordinates, minAnglePosition + 1)!,
//     circularGet(coordinates, minAnglePosition + 2)!,
//   ]);
//
//   circularSet(coordinates, minAnglePosition - 2, updated[0]);
//   circularSet(coordinates, minAnglePosition - 1, updated[1]);
//   circularSet(coordinates, minAnglePosition + 1, updated[2]);
//   circularSet(coordinates, minAnglePosition + 2, updated[3]);
//
//   coordinates.splice(minAnglePosition, 1);
//
//   return simplifyPolygonUntilLimit_(coordinates, limit);
// };

/**
 * Auxiliary wrapper function for simplifyPolygonUntilLimit that makes it
 * compatible with the OpenLayers / GeoJSON style coordinate lists where the
 * first and last vertices are duplicates of each other.
 */
export const simplifyPolygon = <C extends Coordinate2D | EasNor | LonLat>(
  [_, ...coordinates]: C[],
  target: number
): Result<C[], string> => {
  if (!arePolygonCoordinates(coordinates)) {
    return err('polygons need to have at least three 2D vertices');
  }

  if (target < 3) {
    return err('simplification vertex count target cannot be less than 3');
  }

  const mutablePolygon = new MutablePolygon(coordinates);
  // const original = structuredClone(coordinates);
  simplifyPolygonUntilLimit(mutablePolygon, target);
  const result = mutablePolygon.coordinates;

  // HACK: Get rid of any self-intersections or holes...
  //       Maybe combining `unkink-polygon` with `union` would be nicer?
  const cleanResult = bufferPolygon(result as any, 0);

  if (!cleanResult.isOk()) {
    return err(cleanResult.error);
  }

  // const result = simplifyPolygonUntilLimit(mutablePolygon, target);
  // const [result, meta] = simpliwhy(coordinates);

  // console.log({ result });
  // if (
  //   !isCoordinate2D(result[0]) ||
  //   result.some((c) => !isCoordinate2D(c) || c.some(Number.isNaN))
  // ) {
  //   return err('polygons need to have at least three 2D vertices');
  // }

  // return ok([original.at(-1), ...original] as C[]);

  // NOTE: Type assertion justified by `simplifyPolygonUntilLimit`
  //       returning coordinates of the same type as were passed.
  return ok([...cleanResult.value, cleanResult.value[0]] as C[]);
};
