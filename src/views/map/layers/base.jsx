import _ from 'lodash';
import { layer as olLayer, source } from '@collmot/ol-react';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import { Source, Sources, labelForSource } from '../../../model/sources';
import { selectMapSource } from '../../../actions/map';

const BING_API_KEY = process.env.FLOCKWAVE_BING_API_KEY;

// === Settings for this particular layer type ===

class BaseLayerSettingsPresentation extends React.Component {
  render() {
    const sourceRadioButtons = _.map(Sources, source => (
      <FormControlLabel
        key={source}
        value={source}
        label={labelForSource(source)}
        style={{ marginTop: 5 }}
        control={<Radio />}
      />
    ));
    return (
      <RadioGroup
        key="baseProperties"
        name="source.base"
        value={this.props.layer.parameters.source}
        onChange={this.props.onLayerSourceChanged}
      >
        {sourceRadioButtons}
      </RadioGroup>
    );
  }
}

BaseLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  onLayerSourceChanged: PropTypes.func
};

export const BaseLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerSourceChanged: (event, value) => {
      dispatch(selectMapSource({ layerId: ownProps.layerId, source: value }));
    }
  })
)(BaseLayerSettingsPresentation);

// === The actual layer to be rendered ===

// This component needs to be pure to avoid flickering when the BaseLayer
// component is re-rendered; otherwise it would re-render the source, which
// would in turn re-create the layer source object.
//
// Most likely it could be solved in ol-react as well, but it's easier to
// do it here.

class LayerSource extends React.PureComponent {
  render() {
    const { type } = this.props;
    switch (type) {
      case Source.OSM:
        return <source.OSM />;

      case Source.GOOGLE_MAPS.DEFAULT:
        return (
          <source.XYZ url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}" />
        );

      case Source.GOOGLE_MAPS.SATELLITE:
        return (
          <source.XYZ url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
        );

      case Source.BING_MAPS.AERIAL_WITH_LABELS:
        return (
          <source.BingMaps
            apiKey={BING_API_KEY}
            imagerySet="AerialWithLabels"
            maxZoom={19}
          />
        );

      case Source.BING_MAPS.ROAD:
        return <source.BingMaps apiKey={BING_API_KEY} imagerySet="Road" />;
    }
  }
}
LayerSource.propTypes = {
  type: PropTypes.string
};

export const BaseLayer = ({ layer, zIndex }) => (
  <olLayer.Tile zIndex={zIndex}>
    <LayerSource type={layer.parameters.source} />
  </olLayer.Tile>
);
BaseLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number
};
