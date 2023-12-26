import { type UAVFilter } from '~/model/filtering';
import {
  type AltitudeSummaryType,
  type BatteryDisplayStyle,
  type CoordinateFormat,
  type UAVOperationConfirmationStyle,
} from '~/model/settings';
import { type UAVSortKey } from '~/model/sorting';

export enum AppSettingsDialogTab {
  API_KEYS = 'apiKeys',
  DISPLAY = 'display',
  PREFLIGHT = 'preflight',
  SERVER = 'server',
  THREE_D = 'threeD',
  UAVS = 'uavs',
}

export enum Theme {
  AUTO = 'auto',
  DARK = 'dark',
  LIGHT = 'light',
}

export enum UAVListLayout {
  GRID = 'grid',
  LIST = 'list',
}

// Set of application settings.
// This is a two-level key-value store; the first level is the
// setting 'categories', the second level is the actual settings.
export type SettingsState = {
  display: {
    /** Altitude summary type */
    altitudeSummaryType: AltitudeSummaryType;

    /** Display format of coordinates */
    coordinateFormat: CoordinateFormat;

    /** Whether to allow the user to see experimental features */
    experimentalFeaturesEnabled: boolean;

    /** Whether to hide empty mission slots in the UAV list (unless editing) */
    hideEmptyMissionSlots: boolean;

    /** Language code for the selected language of the application */
    language: 'en' | 'hu';

    /** Whether the application should be optimized for operating a single UAV. */
    optimizeForSingleUAV: boolean;

    /** Whether the UI should be adjusted primarily for touchscreen experience. */
    optimizeUIForTouch: boolean;

    /** Whether to show mission IDs or drone IDs in the UAV list */
    showMissionIds: boolean;

    /** Whether to show the mouse coordinates on the map */
    showMouseCoordinates: boolean;

    /** Whether to show the scale on the map */
    showScaleLine: boolean;

    /** Which UI theme to use (choose from OS, use light mode or use dark mode) */
    theme: Theme;

    /** Whether to hide inactive segments on dark mode LCD clocks */
    hideInactiveSegmentsOnDarkLCD: boolean;

    /** Filters applied to the UAV list */
    uavListFilters: UAVFilter[];

    /** Layout of the UAV list: grid or list */
    uavListLayout: UAVListLayout;

    /** Sort preference of the UAV list */
    uavListSortPreference: {
      key: UAVSortKey;
      reverse: boolean;
    };
  };

  // TODO: Find / create proper enums from AFrame for some of these.
  // (Taking into account the mappings of old values in the selectors?)
  threeD: {
    /** Scenery to use in the 3D view */
    scenery: 'auto' | 'outdoor' | 'indoor';

    /** Lighting conditions to use in the 3D view */
    lighting: 'light' | 'dark';

    /**
     * Whether to show grid lines on the ground in 3D view. Values correspond
     * to the 'grid' setting of aframe-environment-component; currently we
     * support 'none', '1x1' and '2x2'
     */
    grid: 'none' | '1x1' | '2x2';

    /** Rendering quality of the 3D view (low, medium or high) */
    quality: 'low' | 'medium' | 'hight';

    /** Whether to show the coordinate system axes */
    showAxes: boolean;

    /** Whether to show the home positions of the UAVs */
    showHomePositions: boolean;

    /** Whether to show the landing positions of the UAVs */
    showLandingPositions: boolean;

    /** Whether to show statistics about the rendering in an overlay */
    showStatistics: boolean;

    /** Whether to show the planned trajectories of the selected UAVs */
    showTrajectoriesOfSelection: boolean;
  };

  localServer: {
    /** Additional command line arguments to pass to the server */
    cliArguments: string;

    /**
     * Whether a local server has to be launched upon startup. This is
     * disabled until we have a reliable and tested way to launch the
     * server on all platforms.
     */
    enabled: boolean;

    /** Search path of the server */
    searchPath: string[];
  };

  uavs: {
    /**
     * Stores whether UAVs that have not been seen for a long while should
     * be forgotten automatically. We start with safe settings so this is
     * set to false by default
     */
    autoRemove: boolean;

    /**
     * Number of seconds after which a UAV with no status updates is
     * marked by a warning state
     */
    warnThreshold: number;

    /**
     * Number of seconds after which a UAV with no status updates is
     * marked as gone
     */
    goneThreshold: number;

    /**
     * Number of seconds after which a UAV with no status updates is
     * removed from the UAV list
     */
    forgetThreshold: number;

    /**
     * Desired placement accuracy in preflight checks, in millimeters,
     * as an integer, to avoid rounding errors
     */
    placementAccuracy: number;

    // Battery-related properties

    /**
     * Default battery cell count that the GCS assumes for drones that do not
     * provide battery percentage estimates
     */
    defaultBatteryCellCount: number;

    /** Voltage of a fully charged battery cell, in volts */
    fullChargeVoltage: number;

    /** Low battery warning threshold (per cell), in volts */
    lowVoltageThreshold: number;

    /** Critical battery warning threshold (per cell), in volts */
    criticalVoltageThreshold: number;

    /**
     * Whether to prefer percentages or voltages
     * when showing the battery status
     */
    preferredBatteryDisplayStyle: BatteryDisplayStyle;

    /**
     * Wheter to ask for confirmation when performing
     * certain UAV-related operations
     */
    uavOperationConfirmationStyle: UAVOperationConfirmationStyle;
  };

  apiKeys: Record<string, string>;
};
