// @ts-nocheck

import React from 'react';

import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

import Widget from '~/components/Widget';
import { connect } from 'react-redux';
import { updateGeofenceSettings } from '~/features/safety/slice';
import { updateGeofencePolygon } from '~/features/safety/actions';
import throttle from 'lodash-es/throttle';
import { getGeofenceSettings } from '~/features/safety/selectors';

type MapToolbarsProps = Readonly<{
  left?: React.ReactChild;
  top?: React.ReactChild;
}>;

const SimplificationSlider = connect(
  (state) => ({ value: getGeofenceSettings(state).maxVertexCount }),
  (dispatch) => ({
    // onChange: throttle((e, v) => {
    //   dispatch(
    //     updateGeofenceSettings({
    //       maxVertexCount: v,
    //     })
    //   );
    //   dispatch(updateGeofencePolygon());
    // }, 250),
    onChange(e, v) {
      dispatch(
        updateGeofenceSettings({
          maxVertexCount: v,
        })
      );
      dispatch(updateGeofencePolygon());
    },
  })
)((props) => (
  <Slider
    min={3}
    max={70}
    marks={[
      { value: 3, label: '3' },
      { value: 70, label: '70' },
    ]}
    valueLabelDisplay='auto'
    {...props}
  />
));

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
    <Widget
      key='Widget.BottomToolbar'
      style={{ bottom: 8, left: '50%', transform: 'translateX(-50%)' }}
    >
      <Box display='flex' flexDirection='row' my={1} mx={4} width='500px'>
        <SimplificationSlider />
      </Box>
    </Widget>
  </>
);

export default MapToolbars;
