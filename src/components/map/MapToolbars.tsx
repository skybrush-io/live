import Box from '@mui/material/Box';
import React from 'react';

import Widget from '~/components/Widget';

type MapToolbarsProps = Readonly<{
  left?: React.ReactChild;
  top?: React.ReactChild;
}>;

/**
 * Component that renders the toolbars of a map.
 */
const MapToolbars = ({ left, top }: MapToolbarsProps) => (
  <>
    {left && (
      <Widget key='Widget.LeftToolbar' style={{ top: 8 + 48 + 8, left: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>{left}</Box>
      </Widget>
    )}
    {top && (
      <Widget key='Widget.TopToolbar' style={{ top: 8, left: 8 + 24 + 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>{top}</Box>
      </Widget>
    )}
  </>
);

export default MapToolbars;
