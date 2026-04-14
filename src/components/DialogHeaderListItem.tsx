import Clear from '@mui/icons-material/Clear';
import Done from '@mui/icons-material/Done';
import Warning from '@mui/icons-material/Warning';
import CircularProgress from '@mui/material/CircularProgress';
import ListItem, { type ListItemProps } from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import { green, red, yellow } from '@mui/material/colors';
import type { Theme } from '@mui/material/styles';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: isThemeDark(theme) ? '#303030' : theme.palette.grey[200],
    paddingTop: 0,
    paddingBottom: 0,
  },
  button: {
    '&:hover': {
      backgroundColor: isThemeDark(theme) ? '#303030' : theme.palette.grey[200],
    },
  },
}));

type Props = Omit<ListItemProps, 'divider' | 'className'> & {
  onClick?: () => void;
};

/**
 * List item component that can be placed at the top of a dialog box, typically
 * below the dialog title or toolbar, to provide a single line of information
 * to the user in a prominent manner.
 */
const DialogHeaderListItem = ({ children, onClick, ...rest }: Props) => {
  const classes = useStyles();
  return onClick ? (
    <ListItem divider disableGutters className={classes.root} {...rest}>
      <ListItemButton
        disableRipple
        disableTouchRipple
        className={classes.button}
        onClick={onClick}
      >
        {children}
      </ListItemButton>
    </ListItem>
  ) : (
    <ListItem divider className={classes.root} {...rest} />
  );
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
