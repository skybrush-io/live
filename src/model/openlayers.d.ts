import type Feature from 'ol/Feature';

import type { Feature as InternalFeature } from '~/model/features';

export declare function isFeatureModifiable(
  object: Feature | null | undefined
): boolean;

export declare function isFeatureTransformable(
  object: Feature | null | undefined
): boolean;

export declare function createFeaturesFromOpenLayers(
  olFeature: Feature
): Array<Partial<InternalFeature>>;
