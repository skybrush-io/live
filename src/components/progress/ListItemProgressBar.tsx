import LinearProgress from '@mui/material/LinearProgress';
import isNil from 'lodash-es/isNil';

type ListItemProgressBarProps = {
  progress?: {
    percentage?: number;
  };
};

const ListItemProgressBar = ({ progress }: ListItemProgressBarProps) => {
  const { percentage } = progress || {};

  if (isNil(percentage)) {
    return <LinearProgress variant='indeterminate' />;
  } else if (
    typeof percentage === 'number' &&
    percentage >= 0 &&
    percentage < 100
  ) {
    return <LinearProgress value={percentage} variant='determinate' />;
  } else {
    return null;
  }
};

export default ListItemProgressBar;
