// NOTE: This declaration file is very incomplete and not
//       even necessarily accurate in what it includes!
//       It was created in the spirit of at least having
//       _something_ might still be better than _nothing_.

declare module '@collmot/ol-react' {
  import { type Validator } from 'prop-types';
  import type React from 'react';

  import type OLCollection from 'ol/Collection';
  import type OLInteraction from 'ol/interaction/Interaction';
  import type OLLayer from 'ol/layer/Layer';
  import type OLMap from 'ol/Map';

  export const control: Record<string, React.ComponentType<any>>;
  export const geom: Record<string, React.ComponentType<any>>;
  export const interaction: Record<string, React.ComponentType<any>>;
  export const layer: Record<string, React.ComponentType<any>>;
  export const source: Record<string, React.ComponentType<any>>;

  export const withLayer: <P extends { layer?: OLLayer }>(
    component: React.ComponentType<P>
  ) => React.ComponentType<Omit<P, 'layer'>>;

  export const withMap: <P extends { map?: OLMap }>(
    component: React.ComponentType<P>
  ) => React.ComponentType<Omit<P, 'map'>>;

  export const Feature: React.ComponentType<any>;
  export const Geolocation: React.ComponentType<any>;
  export const Map: React.ComponentType<
    { interactions?: OLCollection<OLInteraction> } & Record<string, unknown>
  >;
  export const View: React.ComponentType<any>;

  export const OLPropTypes: Record<string, Validator<any>>;
}
