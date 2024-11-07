/**
 * @file Baseline values for the configuration options of the application.
 */

import { type Config } from 'config';

import { LayerType } from '~/model/layers';

const skybrushIcon =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHdpZHRoPSIyNCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iNi4wMjUiIHkxPSIxMi4xNjkiIHgyPSI1LjU2MyIgeTI9IjI2LjQ5NCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzA1NmVkZSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwN2JmZiIvPjwvbGluZWFyR3JhZGllbnQ+PGNsaXBQYXRoIGlkPSJhIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHg9IjQuOTcxIiB5PSItMTIiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjwvY2xpcFBhdGg+PC9kZWZzPjxyZWN0IHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgcnk9IjQuMiIgZmlsbD0iIzAwN2JmZiIvPjxwYXRoIGQ9Ik0yLjI1NyAxMC41MTZ2MTUuNjkybDYuNjEyLjU3M1YxMi4xNjlIMy4xODFsLS45MjQtMS42NTNtOC4wODggMS43NjVoMTEuMzcxdjE2LjY5SDEwLjM0NXoiIGNsaXAtcGF0aD0idXJsKCNhKSIgdHJhbnNmb3JtPSJyb3RhdGUoMzE1IDEyIDEyKSIgZmlsbD0idXJsKCNiKSIvPjxwYXRoIGQ9Ik04LjIyMSAxMy42ODFhMi40OTMgMi40OTMgMCAwIDAtMi40OTYgMi40OTZjMCAxLjA5LS45NjUgMS42NjQtMS42NjQgMS42NjQuNzY1IDEuMDE1IDIuMDcxIDEuNjY0IDMuMzI4IDEuNjY0YTMuMzI3IDMuMzI3IDAgMCAwIDMuMzI4LTMuMzI4IDIuNDkzIDIuNDkzIDAgMCAwLTIuNDk2LTIuNDk2em0xMS40MDUtNy43OTUtMS4xMTUtMS4xMTVhLjgzLjgzIDAgMCAwLTEuMTczIDBsLTcuNDU0IDcuNDU0IDIuMjg4IDIuMjg4IDcuNDU0LTcuNDU0YS44My44MyAwIDAgMCAwLTEuMTczeiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPgo=';

const baseline: Config = {
  branding: {
    splashIcon: {
      srcSet: {
        default: skybrushIcon,
        twoX: skybrushIcon,
      },
      width: 96,
      height: 96,
    },
    splashTitle: 'skybrush live',
  },

  ephemeral: false,

  examples: {
    shows: [],
  },

  features: {
    loadShowFromCloud: false,
    missionEditor: false,
  },

  headerComponents: [
    ['uav-status-summary'],
    [
      'battery-status-header-button',
      'distance-summary-header-button',
      'altitude-summary-header-button',
      'velocity-summary-header-button',
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

  language: {
    default: 'en',
    enabled: new Set(['de', 'en', 'fr', 'hu', 'it', 'ja', 'zh-Hans']),
    fallback: 'en',
  },

  map: {
    drawingTools: [
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

    features: {
      onCreate() {
        /* do nothing */
      },
    },

    layers: [
      { id: 'base', type: LayerType.BASE, label: 'Base map' },
      { id: 'graticule', type: LayerType.GRATICULE, label: 'Graticule' },
      { id: 'beacons', type: LayerType.BEACONS, label: 'Beacons' },
      { id: 'features', type: LayerType.FEATURES, label: 'Features' },
      { id: 'home', type: LayerType.MISSION_INFO, label: 'Mission info' },
      { id: 'uavs', type: LayerType.UAVS, label: 'UAVs' },
    ],

    locations: [
      {
        id: 'budapest',
        name: 'Budapest',
        center: { lon: 19, lat: 47.5 },
        rotation: 0,
        zoom: 11,
        notes: 'The capital of Hungary',
      },
      {
        id: 'elte',
        name: 'ELTE Garden',
        center: { lon: 19.0622, lat: 47.4733 },
        rotation: 348,
        zoom: 17,
        notes: '',
      },
    ],

    origin: {
      position: [19.0622, 47.4733],
      angle: '0',
    },

    tileProviders: {
      bingMaps: false,
      googleMaps: false,
    },

    view: {
      position: [19, 47.5],
      angle: '0',
      zoom: 11,
    },
  },

  optimizeForSingleUAV: {
    default: false,
    force: false,
  },

  optimizeUIForTouch: {
    default: null,
    force: false,
  },

  perspectives: ['default'],

  ribbon: {
    label: null,
    position: 'bottomRight',
  },

  server: {
    connectAutomatically: true,
    preventAutodetection: false,
    preventManualSetup: false,
    hostName: 'localhost',
    port: null,
    isSecure: null,
    warnClockSkew: true,
  },

  session: {
    maxLengthInSeconds: null,
  },

  toastPlacement: 'top-center',
  tour: null,

  urls: {
    help: 'https://doc.collmot.com/public/skybrush-live-doc/latest',
    exit: null,
  },
};

export default baseline;
