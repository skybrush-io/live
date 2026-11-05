import FolderOpen from '@mui/icons-material/FolderOpen';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { keyframes } from '@mui/material/styles';
import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';
import { MiniList } from '@skybrush/mui-components';

import type { Identifier, ItemLike } from '~/utils/collections';

import FileButton from './FileButton';
import ItemListSidebarHeader from './ItemListSidebarHeader';

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
  const lastItemId = items.at(-1)?.id;

  useLayoutEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }, [lastItemId]);

  return (
    <Box className={classes.root}>
      <ItemListSidebarHeader
        removeAllDisabled={items.length === 0}
        removeAllLabel={removeAllLabel}
        title={title}
        onRemoveAllItems={onRemoveAllItems}
      />
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
