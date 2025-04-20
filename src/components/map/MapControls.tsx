import React from 'react';
import { connect } from 'react-redux';

// @ts-expect-error: no declaration file for @collmot/ol-react yet
import { control } from '@collmot/ol-react';

import {
  getExtendedCoordinateFormatter,
  type CoordinatePairFormatter,
} from '~/selectors/formatting';
import type { RootState } from '~/store/reducers';

export type MapControlDisplaySettings = {
  showMouseCoordinates: boolean;
  showScaleLine: boolean;
};

type MapControlsPresentationProps = Partial<MapControlDisplaySettings> & {
  formatCoordinate: CoordinatePairFormatter;
  defaultDisplaySettings: MapControlDisplaySettings;
};

const MapControlsPresentation = ({
  defaultDisplaySettings,
  formatCoordinate,
  showMouseCoordinates,
  showScaleLine,
}: MapControlsPresentationProps): JSX.Element => (
  <>
    <control.Zoom />
    <control.Attribution collapsed collapsible collapseLabel='&laquo;' />
    {(showMouseCoordinates ?? defaultDisplaySettings.showMouseCoordinates) && (
      <control.MousePosition
        key='control.MousePosition'
        hideWhenOut
        projection='EPSG:4326'
        coordinateFormat={formatCoordinate}
      />
    )}
    {(showScaleLine ?? defaultDisplaySettings.showScaleLine) && (
      <control.ScaleLine key='control.ScaleLine' minWidth={128} />
    )}
  </>
);

/**
 * React component that renders the standard OpenLayers controls that we use on maps.
 *
 * This component can be used by multiple maps, so do not connect state update actions here.
 */
const MapControls = connect(
  // mapStateToProps
  (state: RootState) => ({
    formatCoordinate: getExtendedCoordinateFormatter(state),
    defaultDisplaySettings: state.settings.display,
  })
)(MapControlsPresentation);
export default MapControls;
