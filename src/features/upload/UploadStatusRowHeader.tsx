import Box from '@mui/material/Box';
import clsx from 'clsx';
import type { ReactNode } from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'right',
    padding: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },

  selectable: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

type UploadStatusRowHeaderProps = {
  label: ReactNode;
  onClick: (uavIds: string[]) => void;
  uavIds: string[];
};

const UploadStatusRowHeader = ({
  label,
  onClick,
  uavIds,
}: UploadStatusRowHeaderProps) => {
  const classes = useStyles();
  const clickHandler = uavIds.length > 0 ? () => onClick(uavIds) : undefined;

  return (
    <Box
      className={clsx(classes.root, clickHandler && classes.selectable)}
      onClick={clickHandler}
    >
      {label}
    </Box>
  );
};

export default UploadStatusRowHeader;
