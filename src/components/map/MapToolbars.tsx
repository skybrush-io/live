import React from 'react';

import Box from '@material-ui/core/Box';

import Widget from '~/components/Widget';

type MapToolbarsProps = Readonly<{
  left?: React.ReactChild;
  top?: React.ReactChild;
}>;

/**
 * Vertical separator component for horizontal toolbars.
 */
export const VerticalToolbarSeparator = () => (
  <div
    style={{
      display: 'inline-block',
      height: '48px',
      borderLeft: '1px solid rgba(0, 0, 0,  0.172549)',
      verticalAlign: 'top',
    }}
  />
);

/**
 * Component that renders the toolbars of a map.
 */
const MapToolbars = ({ left, top }: MapToolbarsProps) => (
  <>
    {left && (
      <Widget key='Widget.LeftToolbar' style={{ top: 8 + 48 + 8, left: 8 }}>
        <Box display='flex' flexDirection='column'>
          {left}
        </Box>
      </Widget>
    )}
    {top && (
      <Widget key='Widget.TopToolbar' style={{ top: 8, left: 8 + 24 + 8 }}>
        <Box display='flex' flexDirection='row'>
          {top}
        </Box>
      </Widget>
    )}
  </>
);

export default MapToolbars;
