import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Pause from '@material-ui/icons/Pause';
import React from 'react';

type ToolboxDevMenuItemsProps = Readonly<{
  createClickListener: (func: () => void) => () => void;
}>;

const freezeUI = (seconds = 3): void => {
  const deadline = performance.now() + seconds * 1000;
  while (performance.now() < deadline) {
    // Do nothing
  }
};

const ToolboxDevMenuItems = ({
  createClickListener,
}: ToolboxDevMenuItemsProps): JSX.Element => {
  return (
    <>
      <Divider />
      <MenuItem onClick={createClickListener(freezeUI)}>
        <ListItemIcon>
          <Pause />
        </ListItemIcon>
        <ListItemText primary='Freeze UI for 3 seconds' />
      </MenuItem>
    </>
  );
};

export default ToolboxDevMenuItems;
