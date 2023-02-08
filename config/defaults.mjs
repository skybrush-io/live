/**
 * @file
 * File for documenting the configuration options of the application along with
 * their default values.
 */
const defaults = {
  /**
   * Whether the application's state should be reset on each run instead of
   * recalling the last stored session.
   * @type {boolean}
   */
  ephemeral: false,

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
  examples: [],

  /**
   * Select which functionalities of the application are available. Features not
   * listed (explicitly set to `false`) are considered to be allowed by default.
   *
   * @type {Object}
   * The currently possible keys of the object are:
   * - beacons
   * - docks
   * - features (Objects that can be drawn and edited on the map.)
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

  /**
   * Configuration for electron-builder.
   *
   * @type {Object}
   * For the list of available options and their documentation see:
   * https://www.electron.build/configuration/configuration.html#configuration
   *
   * TODO: This might actually not be relevant anymore.
   */
  electronBuilder: {},
};

export default defaults;
