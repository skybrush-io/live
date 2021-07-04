import PropTypes from 'prop-types';

const descriptions = {
  'rtcm2/1': 'Differential GPS Corrections',
  'rtcm2/2': 'Delta Differential GPS Corrections',
  'rtcm2/3': 'GNSS Reference Station Parameters',
  'rtcm2/4': 'Reference Station Datum',
  'rtcm2/5': 'GPS Constellation Health',
  'rtcm2/6': 'GPS Null Frame',
  'rtcm2/7': 'DGPS Radiobeacon Almanac',
  'rtcm2/8': 'Pseudolite Almanac',
  'rtcm2/9': 'GPS Partial Correction Set',
  'rtcm2/14': 'GPS Time of Week',
  'rtcm2/15': 'Ionospheric Delay Message',
  'rtcm2/16': 'GPS Special Message',
  'rtcm2/18': 'RTK Uncorrected Carrier Phases',
  'rtcm2/19': 'RTK Uncorrected Pseudoranges',
  'rtcm2/22': 'Extended Reference Station Parameters',
  'rtcm2/23': 'Antenna Type Definition Record',
  'rtcm2/24': 'Antenna Reference Point (ARP)',
  'rtcm2/36': 'GLONASS Special Message',
  'rtcm3/1001': 'L1-only GPS RTK',
  'rtcm3/1002': 'Extended L1-only GPS RTK',
  'rtcm3/1003': 'L1 & L2 GPS RTK',
  'rtcm3/1004': 'Extended L1 & L2 GPS RTK',
  'rtcm3/1005': 'RTK antenna position',
  'rtcm3/1006': 'RTK antenna pos with height',
  'rtcm3/1007': 'Antenna descriptor',
  'rtcm3/1008': 'Antenna descriptor & serial',
  'rtcm3/1009': 'L1-only GLONASS RTK',
  'rtcm3/1010': 'Extended L1-only GLONASS RTK',
  'rtcm3/1011': 'L1 & L2 GLONASS RTK',
  'rtcm3/1012': 'Extended L1 & L2 GLONASS RTK',
  'rtcm3/1013': 'System parameters',
  'rtcm3/1014': 'Network aux station data',
  'rtcm3/1015': 'GPS ionospheric correction',
  'rtcm3/1016': 'GPS geometric correction',
  'rtcm3/1017': 'GPS ionospheric & geometric correction',
  'rtcm3/1019': 'GPS ephemerides',
  'rtcm3/1020': 'GLONASS ephemerides',
  'rtcm3/1029': 'Unicode text string',
  'rtcm3/1030': 'GPS network RTK residual',
  'rtcm3/1031': 'GLONASS network RTK residual',
  'rtcm3/1032': 'Physical reference station position',
  'rtcm3/1033': 'Receiver and antenna descriptors',
  'rtcm3/1034': 'GPS FKP gradient',
  'rtcm3/1035': 'GLONASS FKP gradient',
  'rtcm3/1037': 'GLONASS ionospheric correction',
  'rtcm3/1038': 'GLONASS geometric correction',
  'rtcm3/1039': 'GLONASS ionospheric & geometric correction',
  'rtcm3/1042': 'BDS (BeiDou) ephemerides',
  'rtcm3/1044': 'QZSS ephemerides',
  'rtcm3/1045': 'GALILEO F/NAV ephemerides',
  'rtcm3/1046': 'GALILEO I/NAV ephemerides',
  'rtcm3/1071': 'GPS MSM1 (DGNSS pseudorange)',
  'rtcm3/1072': 'GPS MSM2 (RTK pseudorange)',
  'rtcm3/1073': 'GPS MSM3 (code, carrier)',
  'rtcm3/1074': 'GPS MSM4 (code, carrier, CNR)',
  'rtcm3/1075': 'GPS MSM5 (code, carrier, doppler, CNR)',
  'rtcm3/1076': 'GPS MSM6 (hi-res code, carrier, doppler)',
  'rtcm3/1077': 'GPS MSM7 (hi-res code, carrier, doppler, CNR)',
  'rtcm3/1081': 'GLONASS MSM1 (DGNSS pseudorange)',
  'rtcm3/1082': 'GLONASS MSM2 (RTK pseudorange)',
  'rtcm3/1083': 'GLONASS MSM3 (code, carrier)',
  'rtcm3/1084': 'GLONASS MSM4 (code, carrier, CNR)',
  'rtcm3/1085': 'GLONASS MSM5 (code, carrier, doppler, CNR)',
  'rtcm3/1086': 'GLONASS MSM6 (hi-res code, carrier, doppler)',
  'rtcm3/1087': 'GLONASS MSM7 (hi-res code, carrier, doppler, CNR)',
  'rtcm3/1091': 'Galileo MSM1 (DGNSS pseudorange)',
  'rtcm3/1092': 'Galileo MSM2 (RTK pseudorange)',
  'rtcm3/1093': 'Galileo MSM3 (code, carrier)',
  'rtcm3/1094': 'Galileo MSM4 (code, carrier, CNR)',
  'rtcm3/1095': 'Galileo MSM5 (code, carrier, doppler, CNR)',
  'rtcm3/1096': 'Galileo MSM6 (hi-res code, carrier, doppler)',
  'rtcm3/1097': 'Galileo MSM7 (hi-res code, carrier, doppler, CNR)',
  'rtcm3/1101': 'SBAS MSM1 (DGNSS pseudorange)',
  'rtcm3/1102': 'SBAS MSM2 (RTK pseudorange)',
  'rtcm3/1103': 'SBAS MSM3 (code, carrier)',
  'rtcm3/1104': 'SBAS MSM4 (code, carrier, CNR)',
  'rtcm3/1105': 'SBAS MSM5 (code, carrier, doppler, CNR)',
  'rtcm3/1106': 'SBAS MSM6 (hi-res code, carrier, doppler)',
  'rtcm3/1107': 'SBAS MSM7 (hi-res code, carrier, doppler, CNR)',
  'rtcm3/1111': 'QZSS MSM1 (DGNSS pseudorange)',
  'rtcm3/1112': 'QZSS MSM2 (RTK pseudorange)',
  'rtcm3/1113': 'QZSS MSM3 (code, carrier)',
  'rtcm3/1114': 'QZSS MSM4 (code, carrier, CNR)',
  'rtcm3/1115': 'QZSS MSM5 (code, carrier, doppler, CNR)',
  'rtcm3/1116': 'QZSS MSM6 (hi-res code, carrier, doppler)',
  'rtcm3/1117': 'QZSS MSM7 (hi-res code, carrier, doppler, CNR)',
  'rtcm3/1121': 'BeiDou MSM1 (DGNSS pseudorange)',
  'rtcm3/1122': 'BeiDou MSM2 (RTK pseudorange)',
  'rtcm3/1123': 'BeiDou MSM3 (code, carrier)',
  'rtcm3/1124': 'BeiDou MSM4 (code, carrier, CNR)',
  'rtcm3/1125': 'BeiDou MSM5 (code, carrier, doppler, CNR)',
  'rtcm3/1126': 'BeiDou MSM6 (hi-res code, carrier, doppler)',
  'rtcm3/1127': 'BeiDou MSM7 (hi-res code, carrier, doppler, CNR)',
  'rtcm3/1230': 'GLONASS L1 and L2 code-phase biases',
};

export function describeMessageType(type) {
  return (
    descriptions[type] ||
    (type && type.startsWith('rtcm2/')
      ? `RTCMv2 message, type ${type.slice(6)}`
      : type && type.startsWith('rtcm3/')
      ? `RTCMv3 message, type ${type.slice(6)}`
      : `Unknown message, type ${type}`)
  );
}

export function formatSurveyAccuracy(value, { max = 20, short = false } = {}) {
  return value > max
    ? `> ${max}m`
    : value >= 1
    ? value.toFixed(2) + 'm'
    : value >= 0.1
    ? (value * 100).toFixed(short ? 0 : 1) + 'cm'
    : (value * 100).toFixed(1) + 'cm';
}

export const RTKPropTypes = {
  survey: PropTypes.shape({
    accuracy: PropTypes.number,
    active: PropTypes.bool,
    supported: PropTypes.bool,
    valid: PropTypes.bool,
  }),
};
