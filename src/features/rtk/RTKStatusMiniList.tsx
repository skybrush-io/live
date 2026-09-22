import { MiniList } from '@skybrush/mui-components';

import GPSFixStatusMiniList from '~/components/uavs/GPSFixStatusMiniList';

import DetailedRTKSurveyStatusMiniListItem from './DetailedRTKSurveyStatusMiniListItem';
import OverallRTKSurveyStatusMiniListItem from './OverallRTKSurveyStatusMiniListItem';
import RTKSatelliteCountMiniList from './RTKSatelliteCountMiniList';

const RTKStatusMiniList = () => (
  <MiniList sx={{ minWidth: 150 }}>
    <OverallRTKSurveyStatusMiniListItem />
    <DetailedRTKSurveyStatusMiniListItem />
    <RTKSatelliteCountMiniList />
    <GPSFixStatusMiniList />
  </MiniList>
);

export default RTKStatusMiniList;
