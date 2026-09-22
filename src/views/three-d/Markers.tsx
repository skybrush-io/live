import type { Coordinate3D } from '~/utils/math';

type Props = {
  coordinates: Array<Coordinate3D | null>;
  mixin?: string;
};

/**
 * Presentational component that renders a set of markers in the scene at the
 * given Three.JS coordinates.
 */
const Markers = ({ coordinates, mixin }: Props) =>
  coordinates.map((coordinate, index) => {
    const key = `${mixin}-${index}`;
    return (
      coordinate && (
        <a-entity key={key} mixin={mixin} position={coordinate.join(' ')} />
      )
    );
  });

export default Markers;
