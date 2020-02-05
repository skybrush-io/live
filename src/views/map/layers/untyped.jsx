import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import { changeLayerType } from '~/actions/layers';
import {
  LayerTypes,
  iconForLayerType,
  labelForLayerType
} from '~/model/layers';

// === Settings for this particular layer type ===

/* eslint-disable react/jsx-no-bind */
const UntypedLayerSettingsPresentation = ({ onLayerTypeSelected }) => {
  const items = LayerTypes.map(layerType => (
    <Grid key={layerType} item xs={8} sm={4}>
      <Card
        style={{ cursor: 'pointer', height: '100%', userSelect: 'none' }}
        onClick={() => onLayerTypeSelected(layerType)}
      >
        <CardHeader
          avatar={iconForLayerType(layerType)}
          title={labelForLayerType(layerType)}
          style={{ paddingLeft: 16, paddingRight: 16, height: '100%' }}
        />
      </Card>
    </Grid>
  ));
  return (
    <Box display="flex" flexDirection="column">
      <Typography gutterBottom variant="subtitle1" component="p">
        Pick a layer type
      </Typography>
      <Grid
        container
        flex="1"
        alignItems="stretch"
        justify="space-between"
        spacing={2}
      >
        {items}
      </Grid>
    </Box>
  );
};
/* eslint-enable react/jsx-no-bind */

UntypedLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onLayerTypeSelected: PropTypes.func
};

export const UntypedLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerTypeSelected: value => {
      dispatch(changeLayerType(ownProps.layerId, value));
    }
  })
)(UntypedLayerSettingsPresentation);

// === The actual layer to be rendered ===

class UntypedLayerPresentation extends React.Component {
  render() {
    return false;
  }
}

UntypedLayerPresentation.propTypes = {};

export const UntypedLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UntypedLayerPresentation);
