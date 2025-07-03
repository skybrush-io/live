import Divider from '@mui/material/Divider';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';

const useStyles = makeStyles(
  (theme) => ({
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5),
    },
  }),
  { name: 'StyledDivider' }
);

export const ToolbarDivider = (props) => {
  const classes = useStyles();
  return <Divider className={classes.divider} {...props} />;
};

export default ToolbarDivider;
