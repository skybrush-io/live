import Pause from '@mui/icons-material/Pause';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import type React from 'react';

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
}: ToolboxDevMenuItemsProps): React.JSX.Element => {
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
