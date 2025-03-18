import React from 'react';
import { connect } from 'react-redux';

// @ts-ignore
import { control } from '@collmot/ol-react';

import {
  type CoordinatePairFormatter,
  getExtendedCoordinateFormatter,
} from '~/selectors/formatting';
import type { RootState } from '~/store/reducers';

type MapControlsPresentationProps = {
  formatCoordinate: CoordinatePairFormatter;
  showMouseCoordinates: boolean;
  showScaleLine: boolean;
};

const MapControlsPresentation = ({
  formatCoordinate,
  showMouseCoordinates,
  showScaleLine,
}: MapControlsPresentationProps) => (
  <>
    <control.Zoom />
    <control.Attribution collapsed collapsible collapseLabel='&laquo;' />
    {showMouseCoordinates && (
      <control.MousePosition
        key='control.MousePosition'
        hideWhenOut
        projection='EPSG:4326'
        coordinateFormat={formatCoordinate}
      />
    )}
    {showScaleLine && (
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
    ...state.settings.display,
  })
)(MapControlsPresentation);
export default MapControls;
