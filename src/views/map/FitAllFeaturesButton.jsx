/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import flatten from 'lodash-es/flatten';
import { easeOut } from 'ol/easing';
import VectorLayer from 'ol/layer/Vector';
import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import ActionAllOut from '@material-ui/icons/AllOut';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { showError } from '~/features/snackbar/actions';
import { isUavId } from '~/model/identifiers';
import {
  mapReferenceRequestSignal,
  fitAllFeaturesSignal,
  mapViewToExtentSignal,
} from '~/signals';
import { mapViewCoordinateFromLonLat, mergeExtents } from '~/utils/geography';

/**
 * React Component to adjust the view so that it fits all of the current features.
 *
 * @param {Object} props properties of the React component
 * @property {number} margin amount of margin to leave between the features
 * and the border of the view (in pixels)
 * @property {number} duration the amount of time the transition should take (in ms)
 *
 * @emits {mapReferenceRequestSignal} requests map reference.
 */
class FitAllFeaturesButton extends React.Component {
  static propTypes = {
    duration: PropTypes.number,
    margin: PropTypes.number,
    showError: PropTypes.func,
    target: PropTypes.oneOf(['drones', 'all']),
  };

  static defaultProps = {
    target: 'drones',
  };

  _bindings = {};

  componentDidMount() {
    this._bindings.fitAllFeatures = fitAllFeaturesSignal.add(this._handleClick);
    mapReferenceRequestSignal.dispatch(this._onMapReferenceReceived);
  }

  componentWillUnmount() {
    fitAllFeaturesSignal.detach(this._bindings.fitAllFeatures);
    delete this._bindings.fitAllFeatures;
  }

  render() {
    const { target } = this.props;

    return (
      <Translation>
        {(t) => (
          <Tooltip
            content={
              target === 'drones'
                ? t('fitAllFeaturesButton.fitAllDrones')
                : t('fitAllFeaturesButton.fitAllFeatures')
            }
          >
            <IconButton onClick={this._handleClick}>
              <ActionAllOut />
            </IconButton>
          </Tooltip>
        )}
      </Translation>
    );
  }

  /**
   * Returns an array containing the extents that should be encapsulated in the
   * view when zooming.
   */
  _getExtentsToZoomTo = (target) => {
    const featureIdFilter = target === 'drones' ? isUavId : undefined;

    switch (target) {
      case 'all':
      case 'drones': {
        const feasibleLayers = this.map
          .getLayers()
          .getArray()
          .filter(
            (layer) =>
              layer && layer.getVisible() && layer instanceof VectorLayer
          );
        const features = flatten(
          feasibleLayers.map((l) => l.getSource().getFeatures())
        );
        const feasibleFeatures = featureIdFilter
          ? features.filter((feature) => featureIdFilter(feature.getId()))
          : features;
        return feasibleFeatures
          .map((feature) => {
            const geometry = feature.getGeometry();
            return geometry ? geometry.getExtent() : undefined;
          })
          .filter(Boolean);
      }

      default:
        console.warn(`Unknown target to zoom to: ${target}, using 'all'`);
        return this._getExtentsToZoomTo('all');
    }
  };

  /**
   * Callback for receiving the map reference and saving it.
   *
   * @param {ol.Map} map the map to attach the event handlers to
   */
  _onMapReferenceReceived = (map) => {
    this.map = map;
  };

  /**
   * Event handler that calculates the target extent and fits it into the view.
   */
  _handleClick = () => {
    if (!this.map) {
      return;
    }

    const matchedExtents = this._getExtentsToZoomTo(this.props.target);
    if (matchedExtents.length === 0) {
      // There are no features at all to fit into the current view, so we attempt
      // to retrieve the current location of the user and zoom there instead.
      // This only works on secure origins.
      if ('geolocation' in window.navigator) {
        window.navigator.geolocation.getCurrentPosition(
          this._onGeolocationReceived,
          this._onGeolocationError
        );
      } else {
        this.props.showError(
          'There are no features to fit into the view, and geolocation is not available'
        );
      }
    } else {
      // Merge all the feature extents and then zoom there
      const mergedExtent = mergeExtents(matchedExtents);
      mapViewToExtentSignal.dispatch(mergedExtent, {
        padding: this.props.margin,
      });
    }
  };

  /**
   * Event handler that centers the map to the received position.
   *
   * @param {Object} position the position object provided by the geolocation service
   */
  _onGeolocationReceived = (position) => {
    if (!this.map) {
      return;
    }

    const view = this.map.getView();
    const center = mapViewCoordinateFromLonLat([
      position.coords.longitude,
      position.coords.latitude,
    ]);
    view.animate({
      center,
      duration: this.props.duration,
      easing: easeOut,
    });
  };

  /**
   * Event handler that is called when the geolocation service signalled an
   * error.
   *
   * @param {Object} error the error object provided by the geolocation service
   */
  _onGeolocationError = (error) => {
    const { showError } = this.props;

    if (!showError) {
      console.error(error.message);
    } else {
      let message;

      switch (error.code) {
        case 1:
          message = 'Could not retrieve your location: permission denied';
          break;
        case 2:
          message = 'Error while retrieveing your location; try again later';
          break;
        case 3:
          message = 'Timeout while retrieving your locaiton; try again later';
          break;
        default:
          message =
            'An unexpected error happened while retrieving your location';
          console.error(error.message);
      }

      showError(message);
    }
  };
}

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    showError,
  }
)(FitAllFeaturesButton);
