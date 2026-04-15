import Box from '@mui/material/Box';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'right',
    padding: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },

  hover: {
    backgroundColor: theme.palette.action.hover,
  },

  selectable: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const UploadStatusRowHeader = ({ label, onClick, uavIds, ...rest }) => {
  const classes = useStyles();
  const clickHandler = onClick && uavIds ? () => onClick(uavIds) : null;

  return (
    <Box
      className={clsx(classes.root, clickHandler && classes.selectable)}
      onClick={clickHandler}
      {...rest}
    >
      {label}
    </Box>
  );
};

UploadStatusRowHeader.propTypes = {
  label: PropTypes.node,
  onClick: PropTypes.func,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

export default UploadStatusRowHeader;
