import { useSelector } from 'react-redux';

import ScheduleStatusLight from '~/components/progress/ScheduleStatusLight';
import { selectCollectiveRTHSchedule } from '~/features/show/selectors';

const ShowControlScheduleStatusLight = () => {
  const schedule = useSelector(selectCollectiveRTHSchedule);
  return (
    <ScheduleStatusLight
      emptyType='normalShow'
      schedule={schedule?.schedule}
      size='small'
    />
  );
};

export default ShowControlScheduleStatusLight;
