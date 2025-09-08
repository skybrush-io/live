/**
 * @file Functions and constants related to the different types of features
 * that we use on the map.
 */

import FiberManualRecord from '@mui/icons-material/FiberManualRecord';
import ShowChart from '@mui/icons-material/ShowChart';
import PanoramaFishEye from '@mui/icons-material/PanoramaFishEye';
import PanoramaFishEyeTwoTone from '@mui/icons-material/PanoramaFishEyeTwoTone';
import StarBorder from '@mui/icons-material/StarBorder';
import StarTwoTone from '@mui/icons-material/StarTwoTone';

import { type LonLat } from '~/utils/geography';

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
      points: [LonLat, LonLat];
    }
  | {
      type: FeatureType.LINE_STRING;
      points: LonLat[];
    }
  | {
      type: FeatureType.POINTS;
      points: LonLat[];
    }
  | {
      type: FeatureType.POLYGON;
      points: LonLat[];
      holes?: LonLat[][];
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

type FeatureTypeProperties = {
  name: string;
  icon: React.ComponentType;
  iconFilled?: React.ComponentType;
  canBeMeasured: boolean;
  hasInterior: boolean;
  hasPoints: boolean;
};

const propertiesForFeatureTypes: Record<FeatureType, FeatureTypeProperties> = {
  [FeatureType.CIRCLE]: {
    name: 'Circle',
    icon: PanoramaFishEye,
    iconFilled: PanoramaFishEyeTwoTone,
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
    icon: FiberManualRecord,
    canBeMeasured: false,
    hasInterior: false,
    hasPoints: false,
  },
  [FeatureType.POLYGON]: {
    name: 'Polygon',
    icon: StarBorder,
    iconFilled: StarTwoTone,
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
export const getIconOfFeatureType = (
  featureType: FeatureType,
  shouldFill: boolean
): React.ComponentType =>
  ((shouldFill && propertiesForFeatureTypes[featureType]?.iconFilled) ||
    propertiesForFeatureTypes[featureType]?.icon) ??
  propertiesForFeatureTypes[FeatureType.POINTS].icon;

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
