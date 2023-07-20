/**
 * @file Functions and constants related to the different types of features
 * that we use on the map.
 */

import LocationOn from '@material-ui/icons/LocationOn';
import ShowChart from '@material-ui/icons/ShowChart';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import StarBorder from '@material-ui/icons/StarBorder';

import { type Coordinate2D } from '~/utils/math';

/**
 * Enum containing constants for the various feature types that we support.
 */
export enum FeatureType {
  CIRCLE = 'circle',
  LINE_STRING = 'lineString',
  POINTS = 'points',
  POLYGON = 'polygon',
}

export type Feature =
  | {
      type: FeatureType.CIRCLE;
      points: [Coordinate2D, Coordinate2D];
    }
  | {
      type: FeatureType.LINE_STRING;
      points: Coordinate2D[];
    }
  | {
      type: FeatureType.POINTS;
      points: Coordinate2D[];
    }
  | {
      type: FeatureType.POLYGON;
      points: Coordinate2D[];
      holes: Coordinate2D[][];
    };

/**
 * Enum constants for the various label types that we support.
 */
export enum LabelStyle {
  HIDDEN = 'hidden',
  NORMAL = 'normal',
  THICK_OUTLINE = 'thickOutline',
  THIN_OUTLINE = 'thinOutline',
}

const propertiesForFeatureTypes: Record<
  FeatureType,
  {
    name: string;
    icon: React.ComponentType;
    canBeMeasured: boolean;
    hasInterior: boolean;
    hasPoints: boolean;
  }
> = {
  [FeatureType.CIRCLE]: {
    name: 'Circle',
    icon: PanoramaFishEye,
    canBeMeasured: false, // TODO: The area of the circle should be measurable
    hasInterior: true,
    hasPoints: false,
  },
  [FeatureType.LINE_STRING]: {
    name: 'Path',
    icon: ShowChart,
    canBeMeasured: true,
    hasInterior: false,
    hasPoints: true,
  },
  [FeatureType.POINTS]: {
    name: 'Marker',
    icon: LocationOn,
    canBeMeasured: false,
    hasInterior: false,
    hasPoints: false,
  },
  [FeatureType.POLYGON]: {
    name: 'Polygon',
    icon: StarBorder,
    canBeMeasured: true,
    hasInterior: true,
    hasPoints: true,
  },
};

/**
 * Returns the human-readable name of the given feature type.
 *
 * @param featureType - The feature type
 * @returns The human-readable name of the feature type, in lowercase
 */
export function getNameOfFeatureType(featureType: FeatureType): string {
  return propertiesForFeatureTypes[featureType]?.name ?? 'Feature';
}

/**
 * Returns an icon corresponding to the given feature type.
 *
 * @param featureType - The feature type
 * @returns An icon representing the feature type on the UI
 */
export function getIconOfFeatureType(
  featureType: FeatureType
): React.ComponentType {
  return (
    propertiesForFeatureTypes[featureType]?.icon ??
    propertiesForFeatureTypes[FeatureType.POINTS].icon
  );
}

/**
 * Returns whether the feature has a measurable area or length.
 */
export const featureTypeCanBeMeasured = (featureType: FeatureType): boolean =>
  propertiesForFeatureTypes[featureType]?.canBeMeasured ?? false;

/**
 * Returns whether the feature has an interior area that can be filled on the
 * UI if needed.
 */
export const featureTypeHasInterior = (featureType: FeatureType): boolean =>
  propertiesForFeatureTypes[featureType]?.hasInterior ?? false;

/**
 * Returns whether the feature has individual points that are worth showing
 * to the user separately.
 */
export const featureTypeHasPoints = (featureType: FeatureType): boolean =>
  propertiesForFeatureTypes[featureType]?.hasPoints ?? false;
