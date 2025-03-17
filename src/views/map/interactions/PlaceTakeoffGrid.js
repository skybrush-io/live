/**
 * @file OpenLayers interaction that ...
 */

import isNil from 'lodash-es/isNil';
import * as Condition from 'ol/events/condition';
import Interaction from 'ol/interaction/Interaction';
import Layer from 'ol/layer/Layer';
import PropTypes from 'prop-types';

import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { Feature } from 'ol';
import { Circle, Point } from 'ol/geom';
import { whiteThinOutline } from '~/utils/styles';
import PointerInteraction from 'ol/interaction/Pointer';

const fill = new Fill({
  color: 'rgba(255,255,255,0.4)',
});
const stroke = new Stroke({
  color: '#3399CC',
  width: 1.25,
});
const styles = [
  new Style({
    image: new Circle({
      fill: fill,
      stroke: stroke,
      radius: 5,
    }),
    fill: fill,
    stroke: stroke,
  }),
];

/**
 * OpenLayers interaction that ...
 */
class PlaceTakeoffGridInteraction extends PointerInteraction {
  #overlay = new VectorLayer({
    source: new VectorSource(),
    // style: new Style({
    //   image: new Circle({
    //     radius: 8,
    //     fill: new Fill({ color: '#00AEEF' }),
    //     stroke: new Stroke({ color: '#fff', width: 2 }),
    //   }),
    // }),
    updateWhileInteracting: true,
  });

  #sketchFeature = new Feature(new Point([0, 0]));

  handleMoveEvent(event) {
    console.log({ event, int: this, hme: 'hme' });

    // this.#sketchFeature.setStyle(
    //   // new Style({
    //   //   text: new Text({
    //   //     text: 'sajt',
    //   //     fill: new Fill({ color: '#00AEEF' }),
    //   //     stroke: new Stroke({ color: '#fff', width: 2 }),
    //   //   }),
    //   // })
    //   styles
    //   // new Style({
    //   //   image: new Circle({
    //   //     radius: 8,
    //   //     fill: new Fill({ color: '#00AEEF' }),
    //   //     stroke: new Stroke({ color: '#fff', width: 2 }),
    //   //   }),
    //   // })
    // );
    // this._overlay = this.#overlay;
    // this._sketchFeature = this.#sketchFeature;

    this.#sketchFeature.getGeometry().setCoordinates(event.coordinate.slice());

    console.log({
      c: JSON.stringify(this.#sketchFeature.getGeometry().getCoordinates()),
    });
    return super.handleMoveEvent(event);
  }

  // #handlePointerMove(event) {
  //   this._overlay = this.#overlay
  //   this._sketchFeature = this.
  //   console.log({ event, int: this });
  //
  //   this.#overlay.getSource().clear(true);
  //   this.#overlay.getSource().addFeatures(this.#sketchFeature);
  //   this.#sketchFeature.getGeometry().setCoordinates(event.coordinate.slice());
  // }

  setMap(map) {
    console.log({ map });

    this.#overlay.setMap(map);

    this.#overlay.getSource().clear(true);
    this.#overlay.getSource().addFeature(this.#sketchFeature);

    return super.setMap(map);
  }

  // handleEvent(event) {
  //   if (Condition.pointerMove(event)) {
  //     this.#handlePointerMove(event);
  //   }
  //
  //   return super.handleEvent(event);
  // }
}

/**
 * React wrapper around an instance of {@link PlaceTakeoffGridInteraction}
 * that allows us to use it in JSX.
 */
export default createOLInteractionComponent(
  'PlaceTakeoffGrid',
  (props) => new PlaceTakeoffGridInteraction(props),
  {
    propTypes: {
      onPlace: PropTypes.func,
    },
    fragileProps: [],
  }
);
