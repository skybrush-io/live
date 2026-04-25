import { MiniList } from '@skybrush/mui-components';

import GPSFixStatusMiniList from '~/components/uavs/GPSFixStatusMiniList';

import DetailedRTKSurveyStatusMiniListItem from './DetailedRTKSurveyStatusMiniListItem';
import OverallRTKSurveyStatusMiniListItem from './OverallRTKSurveyStatusMiniListItem';
import RTKSatelliteCountMiniList from './RTKSatelliteCountMiniList';

const listStyle = {
  minWidth: 150,
};

const RTKStatusMiniList = () => (
  <MiniList style={listStyle}>
    <OverallRTKSurveyStatusMiniListItem />
    <DetailedRTKSurveyStatusMiniListItem />
    <RTKSatelliteCountMiniList />
    <GPSFixStatusMiniList />
  </MiniList>
);

export default RTKStatusMiniList;
