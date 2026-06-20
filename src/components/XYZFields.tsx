import Box from '@mui/material/Box';
import type { Vector3Tuple } from '@skybrush/math';

import { SimpleDistanceField } from './forms/fields';

const DIMS = [0, 1, 2] as const;

type Props = {
  value: Vector3Tuple;
  onChange?: (newValue: Vector3Tuple) => void;
};

/**
 * Composite component that allows the user to specify the type, origin and
 * orientation of a full flat-Earth coordinate system.
 */
const XYZFields = ({ onChange, value }: Props) => {
  const callbacks = DIMS.map(
    (index) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) {
        return;
      }

      const newCoord = Number.parseFloat(event.target.value);
      if (!Number.isNaN(newCoord)) {
        const newValue: Vector3Tuple = [...value];
        newValue[index] = newCoord;
        onChange(newValue);
      }
    }
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <SimpleDistanceField label='X' value={value[0]} onChange={callbacks[0]} />
      <Box sx={{ p: 1 }} />
      <SimpleDistanceField label='Y' value={value[1]} onChange={callbacks[1]} />
      <Box sx={{ p: 1 }} />
      <SimpleDistanceField label='Z' value={value[2]} onChange={callbacks[2]} />
    </Box>
  );
};

export default XYZFields;
