/**
 * Minimal type declarations for the `shpjs` package that we use for
 * importing shapefiles.
 */

declare module 'shpjs' {
  import type { FeatureCollection } from 'geojson';

  export default function readShapeFile(
    data: ArrayBuffer | Buffer
  ): Promise<FeatureCollection & { fileName: string }>;
}
