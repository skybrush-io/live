import Delete from '@mui/icons-material/Delete';
import FolderOpen from '@mui/icons-material/FolderOpen';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { animated, useTransition } from '@react-spring/web';
import type { ReactNode } from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';
import { MiniList, Tooltip } from '@skybrush/mui-components';

import type { Identifier, ItemLike } from '~/utils/collections';

import FileButton from './FileButton';

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

  list: {
    position: 'relative',
    flex: 1,
    overflow: 'auto',
  },

  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing(1),
    textAlign: 'center',
  },
}));

const ITEM_HEIGHT = 28;

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

  const transitions = useTransition(
    items.map((item, index) => ({ ...item, y: index * ITEM_HEIGHT })),
    {
      from: { position: 'absolute' as const, opacity: 0, y: 0 },
      leave: { height: 0, opacity: 0 },
      enter: ({ y }) => ({ y, opacity: 1 }),
      update: ({ y }) => ({ y }),
      key: (item: T) => item.id,
    }
  );

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
      <MiniList className={classes.list}>
        {transitions(({ y, ...rest }, item) => (
          <animated.div
            style={{
              transform: y.to((y) => `translate3d(0,${y}px,0)`),
              width: '100%',
              ...rest,
            }}
          >
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  onRemoveItem?.(item.id);
                }}
              >
                {renderItem(item)}
              </ListItemButton>
            </ListItem>
          </animated.div>
        ))}
      </MiniList>
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
