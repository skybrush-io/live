/**
 * @file
 * File for documenting the configuration options of the application along with
 * their default values.
 */

const skybrushIcon =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHdpZHRoPSIyNCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iNi4wMjUiIHkxPSIxMi4xNjkiIHgyPSI1LjU2MyIgeTI9IjI2LjQ5NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzA1NmVkZSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwN2JmZiIvPjwvbGluZWFyR3JhZGllbnQ+PGNsaXBQYXRoIGlkPSJhIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHg9IjQuOTcxIiB5PSItMTIiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxyZWN0IHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgcnk9IjQuMiIgZmlsbD0iIzAwN2JmZiIvPjxwYXRoIGQ9Ik0yLjI1NyAxMC41MTZ2MTUuNjkybDYuNjEyLjU3M1YxMi4xNjlIMy4xODFsLS45MjQtMS42NTNtOC4wODggMS43NjVoMTEuMzcxdjE2LjY5SDEwLjM0NXoiIGNsaXAtcGF0aD0idXJsKCNhKSIgdHJhbnNmb3JtPSJyb3RhdGUoMzE1IDEyIDEyKSIgZmlsbD0idXJsKCNiKSIvPjxwYXRoIGQ9Ik04LjIyMSAxMy42ODFhMi40OTMgMi40OTMgMCAwIDAtMi40OTYgMi40OTZjMCAxLjA5LS45NjUgMS42NjQtMS42NjQgMS42NjQuNzY1IDEuMDE1IDIuMDcxIDEuNjY0IDMuMzI4IDEuNjY0YTMuMzI3IDMuMzI3IDAgMCAwIDMuMzI4LTMuMzI4IDIuNDkzIDIuNDkzIDAgMCAwLTIuNDk2LTIuNDk2em0xMS40MDUtNy43OTUtMS4xMTUtMS4xMTVhLjgzLjgzIDAgMCAwLTEuMTczIDBsLTcuNDU0IDcuNDU0IDIuMjg4IDIuMjg4IDcuNDU0LTcuNDU0YS44My44MyAwIDAgMCAwLTEuMTczeiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPgo=';

const defaults = {
  branding: {
    /**
     * Splash screen icon properties on loading screen
     */
    splashIcon: {
      /**
       * Sources for the icon shown on the splash screen during loading.
       */
      srcSet: {
        /**
         * Default (normal) icon src
         * @type {string}
         */
        default: skybrushIcon,
        /**
         * 2x device pixel density icon src
         * @type {string}
         */
        twoX: skybrushIcon,
      },
      /**
       * Icon width in pixels
       * @type {number}
       */
      width: 96,
      /**
       * Icon height in pixels
       * @type {number}
       */
      height: 96,
    },

    /**
     * Title text to be shown on the splash screen during loading.
     * @type {string}
     */
    splashTitle: 'skybrush live',
  },

  /**
   * Whether the application's state should be reset on each run instead of
   * recalling the last stored session.
   * @type {boolean}
   */
  ephemeral: false,

  examples: {
    /**
     * Example shows can be bundled with the application.
     * (Note, that `features.loadShowFromCloud` needs to be enabled as well!)
     *
     * @type {Array}
     * @example
     * examples: [
     *   {
     *     id: 'example-show',
     *     title: 'Example show',
     *     url: 'path/to/example.skyc',
     *   },
     * ],
     */
    shows: [],
  },

  /**
   * Select which functionalities of the application are available. Features not
   * listed (explicitly set to `false`) are considered to be allowed by default.
   *
   * @type {Object}
   * The currently possible keys of the object are:
   * - beacons
   * - docks
   * - mapFeatures (Objects that can be drawn and edited on the map.)
   * - geofence
   * - loadShowFromCloud
   * - missionEditor
   * - perspectives
   * - showControl
   * - threeDView
   * - toolboxMenu
   */
  features: {
    loadShowFromCloud: false,
  },

  /**
   * Select which components should appear on the header, and in what order.
   * The list of available widgets is in `src/components/header/Header.jsx`.
   * Groups specified by subarrays will be separated by vertical dividers.
   *
   * @type {Array.<Array.<string>>}
   */
  headerComponents: [
    ['uav-status-summary'],
    [
      'altitude-summary-header-button',
      'battery-status-header-button',
      'rtk-status-header-button',
    ],
    ['weather-header-button'],
    ['connection-status-button'],
    [
      'server-connection-settings-button',
      'safety-button',
      'authentication-button',
    ],
    [
      'broadcast-button',
      'toolbox-button',
      'app-settings-button',
      'alert-button',
      'help-button',
      'full-screen-button',
      'session-expiry-box',
    ],
  ],

  /**
   * Select which tools should appear on the drawing toolbar of the map,
   * and in what order.
   * The list of available tools is in `src/views/map/DrawingToolbar.jsx`.
   * Groups specified by subarrays will be separated by horizontal dividers.
   *
   * @type {Array.<Array.<string>>}
   */
  mapDrawingToolbarTools: [
    ['select', 'zoom'],
    [
      'add-marker',
      'draw-path',
      'draw-circle',
      'draw-rectangle',
      'draw-polygon',
      'cut-hole',
      'edit-feature',
    ],
  ],

  optimizeForSingleUAV: {
    /**
     * Whether the application should be optimized for operating a single UAV.
     * @type {boolean}
     */
    default: false,

    /**
     * Whether the user should be prevented from changing the default value.
     * @type {boolean}
     */
    force: false,
  },

  optimizeUIForTouch: {
    /**
     * Whether the UI should be adjusted primarily for touchscreen experience.
     *
     * If it is left `undefined` at compile time, the initial state will be
     * determined based on `navigator.maxTouchPoints` during the first run.
     *
     * @type {boolean?}
     */
    default: undefined,

    /**
     * Whether the user should be prevented from changing the default value.
     * @type {boolean}
     */
    force: false,
  },

  /**
   * A list of perspective names or perspective description objects that should
   * be used for creating the initial list of available layouts.
   *
   * For a more detailed example of a perspective description object see:
   * `~/src/features/perspectives/common.js`
   *
   * @type {Array}
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
   *         { type: 'panel', component: 'uav-list', id: 'uavs' },
   *       ],
   *     },
   *   },
   * ],
   */
  perspectives: ['default'],

  ribbon: {
    /**
     * The text shown on the ribbon.
     * The ribbon is not shown at all if the label is not defined.
     * @type {string}
     */
    label: undefined,

    /**
     * The position of the ribbon.
     *
     * @type {string}
     * Has to be one of 'topLeft', 'topRight', 'bottomLeft' and 'bottomRight'.
     */
    position: 'bottomRight',
  },

  server: {
    /**
     * Whether to set up a connection automatically when the application loads.
     * @type {boolean}
     */
    connectAutomatically: true,

    /**
     * Whether to prevent the client from using SSDP for discovering servers.
     * @type {boolean}
     */
    preventAutodetection: false,

    /**
     * Whether to prevent the user from entering connection details manually.
     * @type {boolean}
     */
    preventManualSetup: false,

    /**
     * The hostname / IP address / URL of the server to connect to.
     * @type {string}
     */
    hostName: 'localhost',

    /**
     * The port number to use for the connection.
     * (Will be automatically inferred during onboarding if left empty.)
     * @type {number}
     */
    port: undefined,

    /**
     * Whether to use TLS (SSL) for securing the connection.
     * (Will be automatically inferred during onboarding if left empty.)
     * @type {boolean}
     */
    isSecure: undefined,
  },

  session: {
    /**
     * Optional numeric value to limit the length of a session given in seconds.
     *
     * @type {number}
     * @example
     * maxLengthInSeconds: 3600 // Expire in an hour
     */
    maxLengthInSeconds: undefined,
  },

  /**
   * The desired position of the toast notifications.
   * @type {string}
   *
   * The possible values are: 'bottom-left', 'bottom-center', 'bottom-right',
   *                          'top-left', 'top-center' and 'top-right'
   */
  toastPlacement: 'top-center',

  /**
   * An optional array of steps to guide through the initial user experience on
   * the first run of the application.
   *
   * It is implemented using `elrumordelaluz/reactour`, for the exact API see
   * the documentation at https://www.npmjs.com/package/reactour
   *
   * @type {Object}
   * @example
   * tour: {
   *   steps: [
   *     { selector: '#header', content: 'This is the header.' },
   *     { selector: '#sidebar', content: 'This is the sidebar.' },
   *   ],
   * }
   */
  tour: undefined,

  urls: {
    /**
     * The URL to open upon clicking the help button on the header.
     * (The button is not shown at all if the URL is not defined.)
     * @type {string}
     */
    help: 'https://doc.collmot.com/public/skybrush-live-doc/latest',

    /**
     * The URL to redirect to upon dismissing the session expiry dialog.
     * @see session.maxLengthInSeconds
     * @type {string}
     */
    exit: undefined,
  },
};

export default defaults;
