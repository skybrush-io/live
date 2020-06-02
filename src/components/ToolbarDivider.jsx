import React from 'react';

import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';

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
