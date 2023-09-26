import { type Coordinate2D, type Coordinate3D } from '~/utils/math';

export enum RTKAntennaPositionFormat {
  LON_LAT = 'lonLat',
  ECEF = 'ecef',
}

export type RTKStatistics = {
  /**
   * Timestamp when the statistics was updated the last time,
   * as a UNIX timestamp
   */
  lastUpdatedAt?: number;

  /**
   * Carrier-to-noise ratio for satellites for which we have RTK correction
   * data. Keys are satellite identifiers; each associated value is the
   * corresponding carrier-to-noise ratio and the timestamp.
   */
  satellites: Record<
    string,
    {
      /**
       * UNIX timestamp in milliseconds when this
       * satellite was observed the last time
       */
      lastUpdatedAt: number;

      /** Carrier-to-noise ratio */
      cnr: number;
    }
  >;

  /**
   * RTCM messages recently processed by the server and their bandwidth
   * requirement. Keys are RTCM message identifiers; each associated value is
   * the corresponding bandwidth usage and the timestamp.
   */
  messages: Record<
    string,
    {
      /**
       * UNIX timestamp in milliseconds when this
       * message was observed the last time
       */
      lastUpdatedAt: number;

      /**
       * Number of bytes per second that this RTCM
       * message used from the total bandwidth
       */
      bitsPerSecond: number;
    }
  >;

  /** Information about the antenna position and description */
  antenna: {
    descriptor?: string;
    height?: number;
    position?: Coordinate2D; // should be [lon, lat]
    positionECEF?: Coordinate3D; // should be [x, y, z] integers, in mm
    serialNumber?: string;
    stationId?: number;
  };

  /** Information about the status of the survey process */
  survey: {
    /** Achieved surveying accuracy, in meters */
    accuracy?: number;

    /**
     * Status flags:
     * - bit 0 = survey available
     * - bit 1 = survey in progress
     * - bit 2 = surveyed coordinate valid
     */
    flags?: number;
  };
};
