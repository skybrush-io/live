import partial from 'lodash-es/partial';
import toNumber from 'lodash-es/toNumber';
import numbro from 'numbro';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { getDistance as haversineDistance } from 'ol/sphere';
import { Circle, Fill, Style } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { layer, source } from '@collmot/ol-react';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

import SubscriptionDialog from '~/components/dialogs/SubscriptionDialog';
import { setLayerParametersById } from '~/features/map/layers';
import messageHub from '~/message-hub';
import HashedMap from '~/utils/hashedmap';
import {
  mapViewCoordinateFromLonLat,
  lonLatFromMapViewCoordinate,
} from '~/utils/geography';

const formatNumber = (x) => numbro(x).format({ mantissa: 3 });

const heatmapColoringFunctions = {
  linear: {
    name: 'Linear',
    function: (x) => x,
  },
  logarithmic: {
    name: 'Logarithmic',
    function: (x) => Math.log(x),
  },
};

// === Settings for this particular layer type ===

class HeatmapLayerSettingsPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,
    layerId: PropTypes.string,

    setLayerParameter: PropTypes.func,
    setLayerParameters: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      coloringFunction: props.layer.parameters.coloringFunction,
      minHue: props.layer.parameters.minHue,
      maxHue: props.layer.parameters.maxHue,
    };

    this._refs = Object.assign(
      {},
      ...[
        'subscriptionDialog',
        'threshold',
        'minValue',
        'maxValue',
        'minHue',
        'maxHue',
        'minDistance',
      ].map((x) => ({ [x]: React.createRef() }))
    );

    this._setAutoScale = (event, checked) => {
      this.props.setLayerParameters({ autoScale: checked });
    };

    this._setSnapToGrid = (event, checked) => {
      this.props.setLayerParameters({ snapToGrid: checked });
    };
  }

  render() {
    const { setLayerParameter } = this.props;
    const { parameters } = this.props.layer;
    const { minHue, maxHue } = this.state;

    const textFieldStyle = {
      marginRight: 10,
      width: 125,
    };

    return (
      <div>
        <SubscriptionDialog
          ref={this._refs.subscriptionDialog}
          subscriptions={parameters.subscriptions}
          setSubscriptions={partial(setLayerParameter, 'subscriptions')}
          unit={parameters.unit}
          setUnit={partial(setLayerParameter, 'unit')}
        />

        <Button
          variant='contained'
          style={{ marginBottom: '10px' }}
          onClick={this._showSubscriptionDialog}
        >
          Edit subscriptions
        </Button>

        <br />

        <FormGroup row>
          <TextField
            inputRef={this._refs.threshold}
            style={textFieldStyle}
            label='Threshold'
            type='number'
            defaultValue={formatNumber(parameters.threshold)}
          />

          <FormControl style={{ width: '125px' }}>
            <InputLabel htmlFor='selectedChannel'>Coloring function</InputLabel>

            <Select
              value={this.state.coloringFunction}
              onChange={this._handleColoringFunctionChange}
            >
              {Object.keys(heatmapColoringFunctions).map((key) => (
                <MenuItem key={key} value={key}>
                  {heatmapColoringFunctions[key].name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormGroup>

        <FormGroup row>
          <TextField
            inputRef={this._refs.minValue}
            style={textFieldStyle}
            label='Minimum value'
            type='number'
            defaultValue={formatNumber(parameters.minValue)}
          />
          <TextField
            inputRef={this._refs.maxValue}
            style={textFieldStyle}
            label='Maximum value'
            type='number'
            defaultValue={formatNumber(parameters.maxValue)}
          />
          <FormControlLabel
            label='Autoscale'
            control={
              <Switch
                checked={parameters.autoScale}
                onChange={this._setAutoScale}
              />
            }
          />
        </FormGroup>

        <div style={{ padding: '24px 0' }}>
          <input
            ref={this._refs.minHue}
            id='minHue'
            type='range'
            min='0'
            max='360'
            style={{ width: '100px', verticalAlign: 'middle' }}
            value={minHue}
            onChange={this._handleHueChange}
          />

          <div
            style={{
              display: 'inline-block',
              width: '300px',
              height: '25px',
              margin: '5px',
              verticalAlign: 'middle',
              background: `linear-gradient(-90deg,
              hsla(${maxHue}, 70%, 50%, 0.75),
              hsla(${minHue}, 70%, 50%, 0.75)
            )`,
              borderRadius: '10px',
              boxShadow: '0px 0px 3px 0px black',
            }}
          />

          <input
            ref={this._refs.maxHue}
            id='maxHue'
            type='range'
            min='0'
            max='360'
            style={{ width: '100px', verticalAlign: 'middle' }}
            value={maxHue}
            onChange={this._handleHueChange}
          />
        </div>

        <FormGroup row>
          <TextField
            inputRef={this._refs.minDistance}
            label='Min distance'
            style={textFieldStyle}
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            type='number'
            defaultValue={formatNumber(parameters.minDistance)}
          />
          <FormControlLabel
            label='Snap to grid'
            control={
              <Switch
                checked={parameters.snapToGrid}
                onChange={this._setSnapToGrid}
              />
            }
          />
        </FormGroup>

        <FormGroup row style={{ paddingTop: 10 }}>
          <Button onClick={this._handleClick}>Update parameters</Button>

          <Button color='secondary' onClick={this._clearData}>
            Clear data
          </Button>
        </FormGroup>
      </div>
    );
  }

  _showSubscriptionDialog = () => {
    this._refs.subscriptionDialog.current.showDialog();
  };

  _handleHueChange = (event) => {
    this.setState({
      [event.target.id]: toNumber(event.target.value),
    });
  };

  _handleColoringFunctionChange = (event) => {
    this.setState({
      coloringFunction: event.target.value,
    });
  };

  _handleClick = () => {
    this.props.setLayerParameters({
      threshold: toNumber(this._refs.threshold.current.value),
      coloringFunction: this.state.coloringFunction,
      minValue: toNumber(this._refs.minValue.current.value),
      maxValue: toNumber(this._refs.maxValue.current.value),
      minHue: this.state.minHue,
      maxHue: this.state.maxHue,
      minDistance: toNumber(this._refs.minDistance.current.value),
    });
  };

  _clearData = () => {
    window.localStorage.removeItem(`${this.props.layerId}_data`);

    this._refs.minValue.current.value = 0;
    this.props.setLayerParameters({ minValue: 0 });

    this._refs.maxValue.current.value = 0;
    this.props.setLayerParameters({ maxValue: 0 });
  };
}

export const HeatmapLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
    setLayerParameter(parameter, value) {
      dispatch(
        setLayerParametersById(ownProps.layerId, { [parameter]: value })
      );
    },
  })
)(HeatmapLayerSettingsPresentation);

// === The actual layer to be rendered ===

/**
 * Helper function that calculates the distance of two data packets.
 *
 * @param {devicedata} a the first packet to compare
 * @param {devicedata} b the second packet to compare
 * @return {number} the distance between the packets
 */
const getDistance = (a, b) => haversineDistance([a.lon, a.lat], [b.lon, b.lat]);

/**
 * Helper function that creates an OpenLayers fill style object from a color.
 *
 * @param {color} color the color of the filling
 * @param {number} radius the radius to fill
 * @return {Object} the OpenLayers style object
 */
const makePointStyle = (color, radius) =>
  new Style({
    image: new Circle({
      fill: new Fill({ color }),
      radius,
    }),
  });

class HeatmapVectorSource extends React.Component {
  static propTypes = {
    storageKey: PropTypes.string,
    parameters: PropTypes.object,

    setLayerParameters: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this._sourceRef = undefined;

    this.features = new HashedMap();
  }

  _assignSourceRef = (value) => {
    if (this._sourceRef === value) {
      return;
    }

    if (this._sourceRef) {
      this._sourceRef.source.clear();
    }

    this._sourceRef = value;

    if (this._sourceRef) {
      this._drawFromStoredData();
    }
  };

  componentDidMount() {
    this._trySubscribe(this.props.parameters.subscriptions);
    messageHub.registerNotificationHandler(
      'DEV-INF',
      this._processNotification
    );
  }

  componentDidUpdate() {
    this._drawFromStoredData();
  }

  componentWillUnmount() {
    this._tryUnsubscribe(this.props.parameters.subscriptions);
    messageHub.unregisterNotificationHandler(
      'DEV-INF',
      this._processNotification
    );
  }

  render() {
    return <source.Vector ref={this._assignSourceRef} />;
  }

  _getStoredData = () => {
    if (!window.localStorage.getItem(this.props.storageKey)) {
      window.localStorage.setItem(this.props.storageKey, '[]');
    }

    return new HashedMap(
      JSON.parse(window.localStorage.getItem(this.props.storageKey))
    );
  };

  _setStoredData = (values) => {
    window.localStorage.setItem(
      this.props.storageKey,
      JSON.stringify([...values.data])
    );
  };

  _drawFromStoredData = () => {
    const { source } = this._sourceRef || {};
    if (!source) {
      return;
    }

    source.clear();
    this.features = new HashedMap();

    const values = this._getStoredData();

    for (const [key, value] of values) {
      this.features.set(
        key,
        this._drawPointFromData(Object.assign({ value }, key))
      );
    }
  };

  // TODO: this part should be rewritten to use messageHub.subscribe()
  _trySubscribe = async (subscriptions) => {
    await messageHub.waitUntilReady();
    messageHub.sendMessage({
      type: 'DEV-SUB',
      paths: subscriptions,
    });
  };

  _tryUnsubscribe = async (subscriptions) => {
    await messageHub.waitUntilReady();
    messageHub.sendMessage({
      type: 'DEV-UNSUB',
      paths: subscriptions,
    });
  };

  _processData = (values, data) => {
    const { minDistance } = this.props.parameters;

    /* Converting to the EPSG:3857 projection, snapping it to the grid
    and then converting it back. */
    if (this.props.parameters.snapToGrid) {
      const snappedLonLat = lonLatFromMapViewCoordinate(
        mapViewCoordinateFromLonLat([data.lon, data.lat]).map(
          (c) => Math.round(c / minDistance) * minDistance
        )
      );

      data.lon = snappedLonLat[0];
      data.lat = snappedLonLat[1];

      const snappedKey = { lon: data.lon, lat: data.lat };

      if (values.has(snappedKey)) {
        data.value = (values.get(snappedKey) + data.value) / 2;
        values.set(snappedKey, data.value);
        this.features.get(snappedKey).measuredValue = data.value;

        return;
      }
    } else {
      for (const key of values.keys()) {
        if (getDistance(key, data) < minDistance) {
          data.value = (values.get(key) + data.value) / 2;
          values.set(key, data.value);
          this.features.get(key).measuredValue = data.value;

          return;
        }
      }
    }

    const key = { lon: data.lon, lat: data.lat };
    values.set(key, data.value);
    this.features.set(key, this._drawPointFromData(data));
  };

  _processNotification = (message) => {
    const values = this._getStoredData();

    for (const path in message.body.values) {
      // Check if we are subscribed to this channel
      if (!this.props.parameters.subscriptions.includes(path)) {
        continue;
      }

      // Check if the message actually has a valid value
      if (message.body.values[path].value !== null) {
        const data = message.body.values[path];

        this._processData(values, data);

        if (this.props.parameters.autoScale) {
          if (
            data.value > this.props.parameters.threshold &&
            (data.value < this.props.parameters.minValue ||
              (this.props.parameters.minValue === 0 &&
                this.props.parameters.maxValue === 0))
          ) {
            this.props.setLayerParameters({ minValue: data.value });
          }

          if (data.value > this.props.parameters.maxValue) {
            this.props.setLayerParameters({ maxValue: data.value });
          }
        }
      }
    }

    this._setStoredData(values);

    if (this.features.size !== values.size) {
      this._drawFromStoredData();
    }
  };

  _makePoint = (center) => {
    return new Feature({
      geometry: new Point(mapViewCoordinateFromLonLat(center)),
    });
  };

  _drawPointFromData = (data) => {
    const point = this._makePoint([data.lon, data.lat]);
    point.measuredValue = data.value;

    const { source } = this._sourceRef || {};
    if (source) {
      source.addFeature(point);
    }

    return point;
  };
}

class HeatmapLayerPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,
    layerId: PropTypes.string,
    zIndex: PropTypes.number,

    setLayerParameters: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this._colorForValue = this._colorForValue.bind(this);
    this.styleFunction = this.styleFunction.bind(this);
  }

  _colorForValue(value) {
    const { threshold, coloringFunction, minValue, maxValue, minHue, maxHue } =
      this.props.layer.parameters;

    const processValue = heatmapColoringFunctions[coloringFunction].function;

    const processedValue = processValue(value);
    const processedMin = processValue(minValue);
    const processedMax = processValue(maxValue);

    if (value < threshold) {
      return 'hsla(0, 100%, 100%, 0.5)';
    }

    // Const hue = (value - minValue) / (maxValue - minValue) * (maxHue - minHue) + minHue
    const hueRatio =
      processedMax > processedMin
        ? (processedValue - processedMin) / (processedMax - processedMin)
        : 0;
    const hue = minHue + hueRatio * (maxHue - minHue);

    return `hsla(${hue}, 70%, 50%, 0.5)`;
  }

  styleFunction(feature, resolution) {
    const radius = 0.9 / resolution + 1.5;
    const color = this._colorForValue(feature.measuredValue);
    return makePointStyle(color, radius);
  }

  render() {
    const { minValue, maxValue, unit } = this.props.layer.parameters;

    const displayedUnit = unit || '';

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex} style={this.styleFunction}>
          <HeatmapVectorSource
            storageKey={`${this.props.layerId}_data`}
            parameters={this.props.layer.parameters}
            setLayerParameters={this.props.setLayerParameters}
          />
        </layer.Vector>

        <div
          id='heatmapScale'
          style={{
            background: `linear-gradient(
              hsla(${this.props.layer.parameters.maxHue}, 70%, 50%, 0.75),
              hsla(${this.props.layer.parameters.minHue}, 70%, 50%, 0.75)
            )`,
            borderRadius: '5px',
          }}
        >
          <span>{`${formatNumber(maxValue)} ${displayedUnit}`}</span>
          <span>{`${formatNumber(
            (maxValue + minValue) / 2
          )} ${displayedUnit}`}</span>
          <span>{`${formatNumber(minValue)} ${displayedUnit}`}</span>
        </div>
      </div>
    );
  }
}

export const HeatmapLayer = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(HeatmapLayerPresentation);
