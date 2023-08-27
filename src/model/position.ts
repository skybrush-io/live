import { type GPSFixType } from './enums';

export type GPSFix = {
  type: GPSFixType;
  numSatellites?: number;
  horizontalAccuracy?: number;
  verticalAccuracy?: number;
};

export type GPSPosition = {
  lat: number;
  lon: number;
  amsl?: number;
  ahl?: number;
  agl?: number;
};
