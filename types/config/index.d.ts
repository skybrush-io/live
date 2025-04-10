declare module 'perspective' {
  // TODO: Turn this into an enum somehow? (Not trivial, as those turn
  //       into actual JavaScript code, unlike the rest of this file.)
  namespace LayoutType {
    export type COLUMNS = 'columns';
    export type ROWS = 'rows';
    export type STACK = 'stack';
    export type PANEL = 'panel';
  }
  // export enum LayoutType {
  //   COLUMNS = 'columns',
  //   ROWS = 'rows',
  //   STACK = 'stack',
  //   PANEL = 'panel',
  // }

  export type PerspectiveLayout =
    | {
        type: LayoutType.PANEL;
        component: string;
        id: string;
        width?: number;
        height?: number;
      }
    | {
        type: LayoutType.COLUMNS | LayoutType.ROWS | LayoutType.STACK;
        contents: PerspectiveLayout[];
        width?: number;
        height?: number;
      };

  export type PerspectiveObject = {
    hideHeaders?: boolean;
    isFixed?: boolean;
    label: string;
    layout: PerspectiveLayout;
  };

  export type PerspectiveName = string;

  export type Perspective = PerspectiveObject | PerspectiveName;
}

declare module 'config' {
  import { type Perspective } from 'perspective';
  import { type ReactourProps } from 'reactour';

  import { type Origin, type View } from '~/features/map/types';
  import { type SavedLocation } from '~/features/saved-locations/types';
  import { type LayerType } from '~/model/layers';

  // NOTE: We do need to allow `null` here in order to enable the
  //       "unsetting" of default values in configuration overrides.
  // eslint-disable-next-line @typescript-eslint/ban-types
  type Nullable<T> = T | null;

  export type Config = {
    branding: {
      /** Splash screen icon properties on loading screen */
      splashIcon: {
        /** Source for the icon shown on the splash screen during loading */
        srcSet: {
          /** Default (normal) icon source */
          default: string;
          /** 2x device pixel density icon source */
          twoX: string;
        };

        /** Icon width in pixels */
        width: number;

        /** Icon height in pixels */
        height: number;
      };

      /**
       * Title text to be shown on the splash screen during loading.
       */
      splashTitle: string;
    };

    /**
     * Unique per-variant settings to be used for distributable builds.
     */
    electronBuilder?: {
      appId?: string;
      productName?: string;
    };

    /**
     * Whether the application's state should be reset on each run instead of
     * recalling the last stored session.
     */
    ephemeral: boolean;

    examples: {
      /**
       * Example shows can be bundled with the application.
       * (Note, that `features.loadShowFromCloud` needs to be enabled as well!)
       *
       * @example
       * examples: [
       *   {
       *     id: 'example-show',
       *     title: 'Example show',
       *     url: 'path/to/example.skyc',
       *   },
       * ],
       */
      shows: Array<{ id: string; title: string; url: string }>;
    };

    /**
     * Select which functionalities of the application are available. Features not
     * listed (explicitly set to `false`) are considered to be allowed by default.
     */
    features: Partial<
      Record<
        | 'beacons'
        | 'docks'
        | 'geofence'
        | 'loadShowFromCloud'
        | 'mapFeatures' // (Objects that can be drawn and edited on the map.)
        | 'missionEditor'
        | 'perspectives'
        | 'safetySettings'
        | 'showControl'
        | 'threeDView'
        | 'toolboxMenu',
        boolean
      >
    >;

    /**
     * Select which components should appear on the header, and in what order.
     * The list of available widgets is in `src/components/header/Header.jsx`.
     * Groups specified by subarrays will be separated by vertical dividers.
     */
    headerComponents: string[][];

    language: {
      /** Default display language of the application. */
      default: string;
      /** Set of languages that should be shown in the selector. */
      enabled: Set<string>;
      /** Fallback language to use for missing translations. */
      fallback: string;
    };

    map: {
      /**
       * Select which tools should appear on the drawing toolbar of the map,
       * and in what order.
       * The list of available tools is in `src/views/map/DrawingToolbar.jsx`.
       * Groups specified by subarrays will be separated by horizontal dividers.
       */
      drawingTools: string[][];

      features: {
        /**
         * Post-creation hook function for map features.
         */
        onCreate: (feature: any) => void;
      };

      /**
       * List of layers to be configured on the map by default.
       */
      layers: Array<{
        id: string;
        type: LayerType;
        label: string;
        parameters?: Record<string, unknown>;
      }>;

      /**
       * Preset entries of the saved location list.
       */
      locations: SavedLocation[];

      /**
       * Initial placement of the map origin. If not given, the center and
       * angle of the map view are used as fallback values.
       */
      origin?: Partial<Origin>;

      /**
       * Allowed optional tile providers that we do not want to support in
       * all builds, or that we are not allowed to expose in public builds due
       * to licensing restrictions.
       */
      tileProviders: {
        bingMaps: boolean;
        googleMaps: boolean;
      };

      /**
       * The default position, rotation and zoom level of the map view.
       */
      view: View;
    };

    optimizeForSingleUAV: {
      /**
       * Whether the application should be optimized for operating a single UAV.
       */
      default: boolean;

      /**
       * Whether the user should be prevented from changing the default value.
       */
      force: boolean;
    };

    optimizeUIForTouch: {
      /**
       * Whether the UI should be adjusted primarily for touchscreen experience.
       *
       * If it is left `undefined` at compile time, the initial state will be
       * determined based on `navigator.maxTouchPoints` during the first run.
       */
      default: Nullable<boolean>;

      /**
       * Whether the user should be prevented from changing the default value.
       */
      force: boolean;
    };

    /**
     * A list of perspective description objects or perspective names that
     * should be used for creating the initial list of available layouts.
     *
     * For a more detailed example of a perspective description object see:
     * `~/src/features/perspectives/common.js`
     *
     * @example
     * perspectives: [
     *   'default',
     *   {
     *     hideHeaders: true,
     *     isFixed: true,
     *     label: 'Simple',
     *     layout: {
     *       type: 'columns',
     *       contents: [
     *         { type: 'panel', component: 'map', id: 'map', width: 75 },
     *         { type: 'panel', component: 'uav-list', id: 'uavList' },
     *       ],
     *     },
     *   },
     * ],
     */
    perspectives: Perspective[];

    ribbon: {
      /**
       * The text shown on the ribbon.
       * The ribbon is not shown at all if the label is not defined.
       */
      label: Nullable<string>;

      /**
       * The position of the ribbon.
       */
      position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    };

    server: {
      /**
       * Whether to set up a connection automatically when the application loads.
       */
      connectAutomatically: boolean;

      /**
       * Whether to prevent the client from using SSDP for discovering servers.
       */
      preventAutodetection: boolean;

      /**
       * Whether to prevent the user from entering connection details manually.
       */
      preventManualSetup: boolean;

      /**
       * The hostname / IP address / URL of the server to connect to.
       */
      hostName: string;

      /**
       * The port number to use for the connection.
       * (Will be automatically inferred during onboarding if left empty.)
       */
      port: Nullable<number>;

      /**
       * Whether to use TLS (SSL) for securing the connection.
       * (Will be automatically inferred during onboarding if left empty.)
       */
      isSecure: Nullable<boolean>;

      /**
       * Whether to warn the user about clock skew between the server and the client
       * after a successful connection.
       */
      warnClockSkew: boolean;
    };

    session: {
      /**
       * Optional numeric value to limit the length of a session given in seconds.
       *
       * @example
       * maxLengthInSeconds: 3600 // Expire in an hour
       */
      maxLengthInSeconds: Nullable<number>;
    };

    /**
     * The desired position of the toast notifications.
     */
    toastPlacement:
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right'
      | 'top-left'
      | 'top-center'
      | 'top-right';

    /**
     * An optional array of steps to guide through the initial user experience on
     * the first run of the application.
     *
     * It is implemented using `elrumordelaluz/reactour`, for the exact API see
     * the documentation at https://www.npmjs.com/package/reactour
     *
     * @example
     * tour: {
     *   steps: [
     *     { selector: '#header', content: 'This is the header.' },
     *     { selector: '#sidebar', content: 'This is the sidebar.' },
     *   ],
     * }
     */
    tour: Nullable<ReactourProps>;

    urls: {
      /**
       * The URL to open upon clicking the help button on the header.
       * (The button is not shown at all if the URL is not defined.)
       */
      help: Nullable<string>;

      /**
       * The URL to redirect to upon dismissing the session expiry dialog.
       * @see The `maxLengthInSeconds` property of the `session` key.
       */
      exit: Nullable<string>;
    };
  };

  const config: Config;
  export default config;
}

declare module 'config-overrides' {
  import { type Config } from 'config';
  import { type PartialDeep } from 'type-fest';

  export type ConfigOverrides = PartialDeep<Config>;

  const overrides: ConfigOverrides;
  export default overrides;
}
