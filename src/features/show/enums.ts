export enum EnvironmentType {
  INDOOR = 'indoor',
  OUTDOOR = 'outdoor',
}

export enum SettingsSynchronizationStatus {
  SYNCED = 'synced',
  NOT_SYNCED = 'notSynced',
  IN_PROGRESS = 'inProgress',
  ERROR = 'error',
}

/**
 * The possible show start methods supported by the web frontend.
 */
export enum StartMethod {
  RC = 'rc',
  AUTO = 'auto',
}
