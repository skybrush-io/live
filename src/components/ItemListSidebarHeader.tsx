import Delete from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { makeStyles } from '@skybrush/app-theme-mui';
import { Tooltip } from '@skybrush/mui-components';

const useStyles = makeStyles((theme) => ({
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
}));

type Props = {
  removeAllDisabled: boolean;
  removeAllLabel: string;
  title: string;
  onRemoveAllItems?: () => void;
};

const ItemListSidebarHeader = ({
  removeAllDisabled,
  removeAllLabel,
  title,
  onRemoveAllItems,
}: Props) => {
  const classes = useStyles();

  return (
    <Box className={classes.header}>
      <Box className={classes.title}>{title}</Box>
      {onRemoveAllItems && (
        <Tooltip content={removeAllLabel}>
          <IconButton
            disabled={removeAllDisabled}
            size='large'
            onClick={onRemoveAllItems}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ItemListSidebarHeader;
