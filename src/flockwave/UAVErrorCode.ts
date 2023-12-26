/*
 * @file UAV-related error codes.
 */

enum UAVErrorCode {
  NO_ERROR = 0,

  // Informational messages
  ON_GROUND = 1,
  LOGGING_DEACTIVATED = 2,
  PREARM_CHECK_IN_PROGRESS = 3,
  AUTOPILOT_INITIALIZING = 4,
  TAKEOFF = 5,
  LANDING = 6,
  LANDED = 7,
  MOTORS_RUNNING_WHILE_ON_GROUND = 8,
  SLEEPING = 9,
  FLIGHT_CONTROL_SUSPENDED = 10,
  RETURN_TO_HOME = 63,

  // Warnings
  LOW_DISK_SPACE = 64,
  RC_SIGNAL_LOST_WARNING = 65,
  BATTERY_LOW_WARNING = 66,
  TIMESYNC_ERROR = 67,
  FAR_FROM_TAKEOFF_POSITION = 68,
  INVALID_MISSION_CONFIGURATION = 69,
  RADIO_MISSING = 70,
  GEOFENCE_VIOLATION_WARNING = 71,
  WIND_SPEED_WARNING = 72,
  DISARMED = 73,
  REBOOT_REQUIRED = 74,
  DRIFT_FROM_DESIRED_POSITION = 75,

  // Errors
  AUTOPILOT_COMM_TIMEOUT = 128,
  AUTOPILOT_ACK_TIMEOUT = 129,
  AUTOPILOT_PROTOCOL_ERROR = 130,
  PREARM_CHECK_FAILURE = 131,
  RC_SIGNAL_LOST_ERROR = 132,
  GPS_SIGNAL_LOST = 133,
  BATTERY_LOW_ERROR = 134,
  TARGET_NOT_FOUND = 135,
  TARGET_TOO_FAR = 136,
  CONFIGURATION_ERROR = 137,
  RC_NOT_CALIBRATED = 138,
  WIND_SPEED_ERROR = 139,
  PAYLOAD_ERROR = 140,
  PROXIMITY_ERROR = 141,
  SIMULATED_ERROR = 188,
  CONTROL_ALGORITHM_ERROR = 189,
  SENSOR_FAILURE = 190,
  UNSPECIFIED_ERROR = 191,

  // Critical errors
  HW_SW_INCOMPATIBLE = 192,
  MAGNETIC_ERROR = 193,
  GYROSCOPE_ERROR = 194,
  ACCELEROMETER_ERROR = 195,
  PRESSURE_SENSOR_ERROR = 196,
  GPS_SIGNAL_LOST_CRITICAL = 197,
  MOTOR_MALFUNCTION = 198,
  BATTERY_CRITICAL = 199,
  NO_GPS_HOME_POSITION = 200,
  GEOFENCE_VIOLATION = 201,
  INTERNAL_CLOCK_ERROR = 202,
  EXTERNAL_CLOCK_ERROR = 203,
  REQUIRED_HW_COMPONENT_MISSING = 204,
  AUTOPILOT_INIT_FAILED = 205,
  AUTOPILOT_COMM_FAILED = 206,
  CRASH = 207,
  SIMULATED_CRITICAL_ERROR = 253,
  CRITICAL_SENSOR_FAILURE = 254,
  UNSPECIFIED_CRITICAL_ERROR = 255,
}

const abbreviations: Record<UAVErrorCode, string> = {
  [UAVErrorCode.NO_ERROR]: 'ok',
  [UAVErrorCode.ON_GROUND]: 'ground',
  [UAVErrorCode.LOGGING_DEACTIVATED]: 'no log',
  [UAVErrorCode.PREARM_CHECK_IN_PROGRESS]: 'prearm',
  [UAVErrorCode.AUTOPILOT_INITIALIZING]: 'init',
  [UAVErrorCode.TAKEOFF]: 'takeoff',
  [UAVErrorCode.LANDING]: 'landing',
  [UAVErrorCode.LANDED]: 'landed',
  [UAVErrorCode.MOTORS_RUNNING_WHILE_ON_GROUND]: 'motors',
  [UAVErrorCode.SLEEPING]: 'sleep',
  [UAVErrorCode.FLIGHT_CONTROL_SUSPENDED]: 'paused',
  [UAVErrorCode.RETURN_TO_HOME]: 'RTH',
  [UAVErrorCode.LOW_DISK_SPACE]: 'storage',
  [UAVErrorCode.RC_SIGNAL_LOST_WARNING]: 'RC lost',
  [UAVErrorCode.BATTERY_LOW_WARNING]: 'lowbat',
  [UAVErrorCode.TIMESYNC_ERROR]: 'timesync',
  [UAVErrorCode.FAR_FROM_TAKEOFF_POSITION]: 'tkoffpos',
  [UAVErrorCode.INVALID_MISSION_CONFIGURATION]: 'mission',
  [UAVErrorCode.RADIO_MISSING]: 'no radio',
  [UAVErrorCode.GEOFENCE_VIOLATION_WARNING]: 'fence',
  [UAVErrorCode.WIND_SPEED_WARNING]: 'wind',
  [UAVErrorCode.DISARMED]: 'disarm',
  [UAVErrorCode.REBOOT_REQUIRED]: 'reboot',
  [UAVErrorCode.DRIFT_FROM_DESIRED_POSITION]: 'drift',
  [UAVErrorCode.AUTOPILOT_COMM_TIMEOUT]: 'comm t/o',
  [UAVErrorCode.AUTOPILOT_ACK_TIMEOUT]: 'ack t/o',
  [UAVErrorCode.AUTOPILOT_PROTOCOL_ERROR]: 'proto',
  [UAVErrorCode.PREARM_CHECK_FAILURE]: 'prearm',
  [UAVErrorCode.RC_SIGNAL_LOST_ERROR]: 'RC lost',
  [UAVErrorCode.GPS_SIGNAL_LOST]: 'no GPS',
  [UAVErrorCode.BATTERY_LOW_ERROR]: 'lowbat',
  [UAVErrorCode.TARGET_NOT_FOUND]: 'target',
  [UAVErrorCode.TARGET_TOO_FAR]: 'too far',
  [UAVErrorCode.CONFIGURATION_ERROR]: 'config',
  [UAVErrorCode.RC_NOT_CALIBRATED]: 'RC calib',
  [UAVErrorCode.WIND_SPEED_ERROR]: 'wind',
  [UAVErrorCode.PAYLOAD_ERROR]: 'payload',
  [UAVErrorCode.PROXIMITY_ERROR]: 'proximity',
  [UAVErrorCode.SIMULATED_ERROR]: 'simerr',
  [UAVErrorCode.CONTROL_ALGORITHM_ERROR]: 'control',
  [UAVErrorCode.SENSOR_FAILURE]: 'sensor',
  [UAVErrorCode.UNSPECIFIED_ERROR]: 'error',
  [UAVErrorCode.HW_SW_INCOMPATIBLE]: 'compat',
  [UAVErrorCode.MAGNETIC_ERROR]: 'mag',
  [UAVErrorCode.GYROSCOPE_ERROR]: 'gyro',
  [UAVErrorCode.ACCELEROMETER_ERROR]: 'acc',
  [UAVErrorCode.PRESSURE_SENSOR_ERROR]: 'baro',
  [UAVErrorCode.GPS_SIGNAL_LOST_CRITICAL]: 'GPS',
  [UAVErrorCode.MOTOR_MALFUNCTION]: 'motor',
  [UAVErrorCode.BATTERY_CRITICAL]: 'lowbat',
  [UAVErrorCode.NO_GPS_HOME_POSITION]: 'home',
  [UAVErrorCode.GEOFENCE_VIOLATION]: 'fence',
  [UAVErrorCode.INTERNAL_CLOCK_ERROR]: 'clk',
  [UAVErrorCode.EXTERNAL_CLOCK_ERROR]: 'extclk',
  [UAVErrorCode.REQUIRED_HW_COMPONENT_MISSING]: 'no HW',
  [UAVErrorCode.AUTOPILOT_INIT_FAILED]: 'initfail',
  [UAVErrorCode.AUTOPILOT_COMM_FAILED]: 'commfail',
  [UAVErrorCode.CRASH]: 'crash',
  [UAVErrorCode.SIMULATED_CRITICAL_ERROR]: 'simcrit',
  [UAVErrorCode.CRITICAL_SENSOR_FAILURE]: 'sensor',
  [UAVErrorCode.UNSPECIFIED_CRITICAL_ERROR]: 'fatal',
};

const descriptions: Record<UAVErrorCode, string> = {
  [UAVErrorCode.NO_ERROR]: 'No error',
  [UAVErrorCode.ON_GROUND]: 'Drone is on the ground with motors off',
  [UAVErrorCode.LOGGING_DEACTIVATED]: 'Logging deactivated',
  [UAVErrorCode.PREARM_CHECK_IN_PROGRESS]: 'Prearm check in progress',
  [UAVErrorCode.AUTOPILOT_INITIALIZING]: 'Autopilot initializing',
  [UAVErrorCode.TAKEOFF]: 'Drone is taking off',
  [UAVErrorCode.LANDING]: 'Drone is landing',
  [UAVErrorCode.LANDED]: 'Drone has landed successfully',
  [UAVErrorCode.MOTORS_RUNNING_WHILE_ON_GROUND]:
    'Motors are running while on ground',
  [UAVErrorCode.SLEEPING]: 'Drone is in sleep mode',
  [UAVErrorCode.FLIGHT_CONTROL_SUSPENDED]: 'Flight control is suspended',
  [UAVErrorCode.RETURN_TO_HOME]: 'Drone is returning home',
  [UAVErrorCode.LOW_DISK_SPACE]: 'Low disk space',
  [UAVErrorCode.RC_SIGNAL_LOST_WARNING]: 'RC lost',
  [UAVErrorCode.BATTERY_LOW_WARNING]: 'Battery low',
  [UAVErrorCode.TIMESYNC_ERROR]: 'Timesync error',
  [UAVErrorCode.FAR_FROM_TAKEOFF_POSITION]:
    'Drone is not at its designated takeoff position',
  [UAVErrorCode.INVALID_MISSION_CONFIGURATION]:
    'Mission configuration error or mission out of geofence',
  [UAVErrorCode.RADIO_MISSING]: 'Radio channel offline',
  [UAVErrorCode.GEOFENCE_VIOLATION_WARNING]:
    'Drone is outside geofence on ground',
  [UAVErrorCode.WIND_SPEED_WARNING]: 'Wind speed is high',
  [UAVErrorCode.DISARMED]: 'Drone not armed yet',
  [UAVErrorCode.REBOOT_REQUIRED]: 'Drone requires a reboot',
  [UAVErrorCode.DRIFT_FROM_DESIRED_POSITION]:
    'Drift from desired position is large',
  [UAVErrorCode.AUTOPILOT_COMM_TIMEOUT]: 'Autopilot communication timeout',
  [UAVErrorCode.AUTOPILOT_ACK_TIMEOUT]: 'Autopilot acknowledgment timeout',
  [UAVErrorCode.AUTOPILOT_PROTOCOL_ERROR]:
    'Autopilot communication protocol error',
  [UAVErrorCode.PREARM_CHECK_FAILURE]: 'Prearm check failure',
  [UAVErrorCode.RC_SIGNAL_LOST_ERROR]: 'RC signal lost',
  [UAVErrorCode.GPS_SIGNAL_LOST]: 'GPS signal lost or GPS error',
  [UAVErrorCode.BATTERY_LOW_ERROR]: 'Battery low',
  [UAVErrorCode.TARGET_NOT_FOUND]: 'Target not found',
  [UAVErrorCode.TARGET_TOO_FAR]: 'Target is too far',
  [UAVErrorCode.CONFIGURATION_ERROR]: 'Configuration error',
  [UAVErrorCode.RC_NOT_CALIBRATED]: 'RC not calibrated',
  [UAVErrorCode.WIND_SPEED_ERROR]: 'Wind speed is too high',
  [UAVErrorCode.PAYLOAD_ERROR]: 'Payload error',
  [UAVErrorCode.PROXIMITY_ERROR]: 'Proximity sensor error',
  [UAVErrorCode.SIMULATED_ERROR]: 'Simulated error',
  [UAVErrorCode.CONTROL_ALGORITHM_ERROR]: 'Error in control algorithm',
  [UAVErrorCode.SENSOR_FAILURE]: 'Unspecified sensor failure',
  [UAVErrorCode.UNSPECIFIED_ERROR]: 'Unspecified error',
  [UAVErrorCode.HW_SW_INCOMPATIBLE]: 'Incompatible hardware or software',
  [UAVErrorCode.MAGNETIC_ERROR]: 'Magnetometer error',
  [UAVErrorCode.GYROSCOPE_ERROR]: 'Gyroscope error',
  [UAVErrorCode.ACCELEROMETER_ERROR]: 'Accelerometer error',
  [UAVErrorCode.PRESSURE_SENSOR_ERROR]: 'Pressure sensor or altimeter error',
  [UAVErrorCode.GPS_SIGNAL_LOST_CRITICAL]: 'GPS error or GPS signal lost',
  [UAVErrorCode.MOTOR_MALFUNCTION]: 'Motor malfunction',
  [UAVErrorCode.BATTERY_CRITICAL]: 'Battery critical',
  [UAVErrorCode.NO_GPS_HOME_POSITION]: 'No GPS home position',
  [UAVErrorCode.GEOFENCE_VIOLATION]: 'Geofence violation',
  [UAVErrorCode.INTERNAL_CLOCK_ERROR]: 'Internal clock error',
  [UAVErrorCode.EXTERNAL_CLOCK_ERROR]: 'External clock error',
  [UAVErrorCode.REQUIRED_HW_COMPONENT_MISSING]:
    'Required hardware component missing',
  [UAVErrorCode.AUTOPILOT_INIT_FAILED]: 'Autopilot initialization failed',
  [UAVErrorCode.AUTOPILOT_COMM_FAILED]: 'Autopilot communication failed',
  [UAVErrorCode.CRASH]: 'Drone crashed',
  [UAVErrorCode.SIMULATED_CRITICAL_ERROR]: 'Simulated critical error',
  [UAVErrorCode.CRITICAL_SENSOR_FAILURE]: 'Unspecified critical sensor failure',
  [UAVErrorCode.UNSPECIFIED_CRITICAL_ERROR]: 'Unspecified critical error',
};

namespace UAVErrorCode {
  /**
   * Returns a short abbreviation of the error code that is more-or-less
   * human-readable, but requires less space on the screen than the full
   * description of the error.
   */
  export const abbreviate = (code: UAVErrorCode): string => {
    return abbreviations[code] || `E${code}`;
  };

  /**
   * Returns a human-readable description of the error code.
   */
  export const describe = (code: UAVErrorCode): string => {
    return descriptions[code] || `Error ${code}`;
  };
}

export default UAVErrorCode;
