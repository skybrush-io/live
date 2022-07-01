import React from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { green, red, yellow } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import Done from '@material-ui/icons/Done';
import Warning from '@material-ui/icons/Warning';

import { isThemeDark } from '@skybrush/app-theme-material-ui';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      backgroundColor: isThemeDark(theme)
        ? theme.palette.grey.A400
        : theme.palette.grey[200],
      paddingTop: 6,
    },
  }),
  { name: 'DialogHeaderListItem' }
);

/**
 * List item component that can be placed at the top of a dialog box, typically
 * below the dialog title or toolbar, to provide a single line of information
 * to the user in a prominent manner.
 */
const DialogHeaderListItem = (props) => {
  const classes = useStyles();
  return <ListItem divider className={classes.root} {...props} />;
};

/**
 * Icon presets that can be used in the list item for decoration purposes.
 */
export const ICON_PRESETS = Object.freeze({
  success: (
    <ListItemIcon style={{ color: green[500], margin: '0 0 0 19px' }}>
      <Done />
    </ListItemIcon>
  ),
  warning: (
    <ListItemIcon style={{ color: yellow[700], margin: '0 0 0 19px' }}>
      <Warning />
    </ListItemIcon>
  ),
  inProgress: (
    <ListItemIcon style={{ margin: '0 0 0 19px' }}>
      <CircularProgress variant='indeterminate' color='secondary' size={32} />
    </ListItemIcon>
  ),
  error: (
    <ListItemIcon style={{ color: red[500], margin: '0 0 0 19px' }}>
      <Clear />
    </ListItemIcon>
  ),
});

export default DialogHeaderListItem;
