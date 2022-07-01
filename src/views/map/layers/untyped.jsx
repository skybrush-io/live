import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import { changeLayerType } from '~/features/map/layers';
import {
  areMultipleInstancesAllowedForLayerType,
  LayerTypes,
  iconForLayerType,
  labelForLayerType,
} from '~/model/layers';
import { getLayersInBottomFirstOrder } from '~/selectors/ordered';

// === Selector that finds all the layer types that can be added to the map now ===

const selectLayerTypesThatCanBeAdded = (state) => {
  const result = [];

  const existingLayerTypes = new Set(
    getLayersInBottomFirstOrder(state).map((layer) => layer.type)
  );

  for (const layerType of LayerTypes) {
    if (
      areMultipleInstancesAllowedForLayerType(layerType) ||
      !existingLayerTypes.has(layerType)
    ) {
      result.push(layerType);
    }
  }

  return result;
};

// === Settings for this particular layer type ===

const UntypedLayerSettingsPresentation = ({
  enabledLayerTypes,
  layerTypes,
  onLayerTypeSelected,
}) => {
  const items = layerTypes.map((layerType) => {
    const enabled = enabledLayerTypes.includes(layerType);
    return (
      <Grid key={layerType} item xs={8} sm={4}>
        <Card
          style={{
            cursor: enabled ? 'pointer' : 'auto',
            height: '100%',
            userSelect: 'none',
            opacity: enabled ? 1 : 0.54,
          }}
          elevation={enabled ? 1 : 0}
          variant={enabled ? 'outlined' : 'elevation'}
          onClick={enabled ? () => onLayerTypeSelected(layerType) : null}
        >
          <CardHeader
            avatar={iconForLayerType(layerType)}
            title={labelForLayerType(layerType)}
            style={{ paddingLeft: 16, paddingRight: 16, height: '100%' }}
          />
        </Card>
      </Grid>
    );
  });
  return (
    <Box display='flex' flexDirection='column'>
      <Typography gutterBottom variant='subtitle1' component='p'>
        Pick a layer type
      </Typography>
      <Grid
        container
        flex='1'
        alignItems='stretch'
        justifyContent='flex-start'
        spacing={2}
      >
        {items}
      </Grid>
    </Box>
  );
};

UntypedLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  layerTypes: PropTypes.arrayOf(PropTypes.string),
  enabledLayerTypes: PropTypes.arrayOf(PropTypes.string),

  onLayerTypeSelected: PropTypes.func,
};

export const UntypedLayerSettings = connect(
  // mapStateToProps
  (state) => ({
    layerTypes: LayerTypes,
    enabledLayerTypes: selectLayerTypesThatCanBeAdded(state),
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerTypeSelected(value) {
      dispatch(changeLayerType(ownProps.layerId, value));
    },
  })
)(UntypedLayerSettingsPresentation);

// === The actual layer to be rendered ===

const UntypedLayerPresentation = () => null;

export const UntypedLayer = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {}
)(UntypedLayerPresentation);
