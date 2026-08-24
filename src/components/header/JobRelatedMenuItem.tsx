import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem, { type MenuItemProps } from '@mui/material/MenuItem';
import { Status } from '@skybrush/app-theme-mui';
import { StatusLight } from '@skybrush/mui-components';
import { useSelector } from 'react-redux';

import { getRunningUploadJobType } from '~/features/upload/selectors';
import Pro from '~/icons/Pro';

type Props = {
  title: string;
  jobType?: string;
  pro?: boolean;
} & MenuItemProps;

const JobRelatedMenuItem = ({ jobType, pro, title, ...rest }: Props) => {
  const runningUploadJobType = useSelector(getRunningUploadJobType);
  const isRunning = runningUploadJobType === jobType;
  const isOtherJobRunning = runningUploadJobType !== undefined && !isRunning;

  return (
    <MenuItem {...rest} disabled={isOtherJobRunning}>
      <ListItemIcon sx={{ pl: 0.5 }}>
        {isRunning && <StatusLight inline status={Status.NEXT} />}
      </ListItemIcon>
      <ListItemText
        primary={
          pro ? (
            <>
              {title}
              <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
            </>
          ) : (
            title
          )
        }
      />
    </MenuItem>
  );
};

export default JobRelatedMenuItem;
