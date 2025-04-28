import React from 'react';

import Widget from '~/components/Widget';
import { hasFeature } from '~/utils/configuration';
import MapToolbar from './MapToolbar';

type MapToolbarsProps = {
  children?: {
    drawingToolbar?: React.ReactChild;
  };
};

/**
 * Component that renders the complete toolbar of a map.
 */
const MapToolbars = ({ children }: MapToolbarsProps) => {
  const toolbars = [];

  toolbars.push(
    <Widget
      key='Widget.MapToolbar'
      style={{ top: 8, left: 8 + 24 + 8 }}
      showControls={false}
    >
      <MapToolbar />
    </Widget>
  );

  if (children?.drawingToolbar !== undefined && hasFeature('mapFeatures')) {
    toolbars.push(
      <Widget
        key='Widget.DrawingToolbar'
        style={{ top: 8 + 48 + 8, left: 8 }}
        showControls={false}
      >
        {children.drawingToolbar}
      </Widget>
    );
  }

  return <>{toolbars}</>;
};

export default MapToolbars;
