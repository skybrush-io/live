import Delete from '@mui/icons-material/Delete';
import FolderOpen from '@mui/icons-material/FolderOpen';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { keyframes } from '@mui/material/styles';
import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';
import { MiniList, Tooltip } from '@skybrush/mui-components';

import type { Identifier, ItemLike } from '~/utils/collections';

import FileButton from './FileButton';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 320,
  },

  header: {
    display: 'flex',
    minHeight: theme.spacing(6),
    alignItems: 'center',
    padding: theme.spacing(0, 0, 0, 2),
  },

  title: {
    textTransform: 'uppercase',
    flex: 1,
  },

  listArea: {
    flex: 1,
    position: 'relative',
  },

  list: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'auto',
  },

  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    textAlign: 'center',
  },
  row: {
    animation: `${fadeIn} 250ms ease-out`,
  },
}));

type Props<T extends ItemLike> = {
  canProceed: boolean;
  importLabel: string;
  items: T[];
  proceedLabel: string;
  removeAllLabel: string;
  renderItem: (item: T) => ReactNode;
  title: string;
  onImportItems?: (file?: File) => Promise<void>;
  onRemoveAllItems?: () => void;
  onRemoveItem?: (id: Identifier) => void;
  onStart?: () => Promise<void>;
};

const ItemListSidebar = <T extends ItemLike>({
  canProceed,
  importLabel,
  items,
  proceedLabel,
  removeAllLabel,
  renderItem,
  title,
  onImportItems,
  onRemoveItem,
  onRemoveAllItems,
  onStart,
}: Props<T>) => {
  const classes = useStyles();
  const listRef = useRef<HTMLUListElement | null>(null);

  useLayoutEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }, [items]);

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.title}>{title}</Box>
        {onRemoveAllItems && (
          <Tooltip content={removeAllLabel}>
            <IconButton
              disabled={items.length === 0}
              size='large'
              onClick={onRemoveAllItems}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box className={classes.listArea}>
        <MiniList ref={listRef} className={classes.list}>
          {items.map((item) => (
            <ListItem className={classes.row} disablePadding key={item.id}>
              <ListItemButton
                onClick={() => {
                  onRemoveItem?.(item.id);
                }}
              >
                {renderItem(item)}
              </ListItemButton>
            </ListItem>
          ))}
        </MiniList>
      </Box>
      <Box className={classes.footer}>
        {onImportItems && (
          <FileButton startIcon={<FolderOpen />} onSelected={onImportItems}>
            {importLabel}
          </FileButton>
        )}
        {onStart && (
          <Button
            disabled={!canProceed}
            endIcon={<NavigateNext />}
            onClick={() => {
              void onStart();
            }}
          >
            {proceedLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ItemListSidebar;
