import Delete from '@mui/icons-material/Delete';
import Save from '@mui/icons-material/Save';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useCallback, type MouseEventHandler } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import type { Identifier } from '~/utils/collections';

import { deleteGroup, saveCurrentSelectionAsGroup, selectGroup } from './slice';
import type { SelectionGroup } from './types';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
  title: {
    flexGrow: 1,
    textOverflow: 'ellipsis',
  },
  actions: {
    display: 'flex',
  },
}));

type DispatchProps = {
  deleteGroup: (group: string) => void;
  saveCurrentSelectionAsGroup: (group?: string) => void;
  selectGroup: (group: string) => void;
};

type Props = DispatchProps & {
  /**
   * The displayed selection group.
   */
  group: SelectionGroup;

  /**
   * Event handler called when a clickable action is triggered
   * within the component.
   */
  onClick?: (id: Identifier) => void;
};

const SelectionGroupMenuItem = ({
  deleteGroup,
  group,
  onClick,
  saveCurrentSelectionAsGroup,
  selectGroup,
}: Props) => {
  const { id, name } = group;
  const styles = useStyles();

  const handleSelect: MouseEventHandler<HTMLElement> = useCallback(
    (event) => {
      if (event.isDefaultPrevented()) {
        return;
      }
      selectGroup(id);
      onClick?.(id);
    },
    [id, selectGroup, onClick]
  );

  const handleSave: MouseEventHandler<HTMLElement> = useCallback(
    (event) => {
      event.preventDefault();
      saveCurrentSelectionAsGroup(id);
      onClick?.(id);
    },
    [id, saveCurrentSelectionAsGroup, onClick]
  );

  const handleDelete: MouseEventHandler<HTMLElement> = useCallback(
    (event) => {
      event.preventDefault();
      deleteGroup(id);
      onClick?.(id);
    },
    [id, deleteGroup, onClick]
  );

  return (
    <MenuItem className={styles.root} onClick={handleSelect}>
      <Typography className={styles.title}>
        {id}: {name}
      </Typography>
      <div className={styles.actions}>
        <IconButton size='small' onClick={handleSave}>
          <Save />
        </IconButton>
        <IconButton size='small' onClick={handleDelete}>
          <Delete />
        </IconButton>
      </div>
    </MenuItem>
  );
};

const ConnectedSelectionGroupMenuItem = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    deleteGroup,
    selectGroup,
    saveCurrentSelectionAsGroup,
  }
)(SelectionGroupMenuItem);

export default ConnectedSelectionGroupMenuItem;
