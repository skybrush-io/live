import Divider from '@mui/material/Divider';
import React from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles(
  (theme) => ({
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5),
    },
  }),
);

export const ToolbarDivider = (props) => {
  const classes = useStyles();
  return <Divider className={classes.divider} {...props} />;
};

export default ToolbarDivider;
