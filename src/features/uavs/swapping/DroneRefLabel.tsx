import Box from '@mui/material/Box';

import { formatMissionId } from '~/utils/formatting';

import type { DroneRef, ResolvedDrone } from './types';
import { formatDroneRef } from './utils';

const INFERRED_PART_STYLE = { opacity: 0.5, fontWeight: 'normal' } as const;

type DroneRefLabelProps = {
  droneRef: DroneRef;
  resolved: ResolvedDrone | null | undefined;
};

/**
 * Label of a drone reference in the usual `uavId/showId` notation, where the
 * part that was not entered by the user but inferred from the mapping is dimmed.
 * Shows only the reference itself if the other part cannot be inferred.
 */
const DroneRefLabel = ({ droneRef, resolved }: DroneRefLabelProps) => {
  if (!resolved || resolved.missionIndex === null) {
    return <>{formatDroneRef(droneRef)}</>;
  }

  const showId = formatMissionId(resolved.missionIndex);

  return droneRef.kind === 'uav' ? (
    <>
      {resolved.uavId}
      <Box component='span' sx={INFERRED_PART_STYLE}>
        /{showId}
      </Box>
    </>
  ) : (
    <>
      <Box component='span' sx={INFERRED_PART_STYLE}>
        {resolved.uavId}/
      </Box>
      {showId}
    </>
  );
};

export default DroneRefLabel;
