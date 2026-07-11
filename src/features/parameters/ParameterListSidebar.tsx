import Delete from '@mui/icons-material/Delete';
import FolderOpen from '@mui/icons-material/FolderOpen';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { animated, useTransition } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { MiniList, Tooltip } from '@skybrush/mui-components';

import FileButton from '~/components/FileButton';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { importParametersFromFile, proceedToUpload } from './actions';
import { getParameterManifest, isManifestEmpty } from './selectors';
import { clearManifest, removeParameterFromManifest } from './slice';
import type { Parameter } from './types';

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

type Props = {
  canUpload: boolean;
  manifest: Parameter[];
  onImportItems: (file?: File) => Promise<void>;
  onRemoveAllItems: () => void;
  onRemoveItem: (id: Identifier) => void;
  onStart: () => Promise<void>;
};

/**
 * Sidebar of the parameter upload setup dialog.
 */
const ParameterListSidebar = ({
  canUpload,
  manifest,
  onImportItems,
  onRemoveItem,
  onRemoveAllItems,
  onStart,
}: Props) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const ITEM_HEIGHT = 28;
  const transitions = useTransition(
    manifest.map((item, index) => ({ ...item, y: index * ITEM_HEIGHT })),
    {
      from: { position: 'absolute' as const, opacity: 0, y: 0 },
      leave: { height: 0, opacity: 0 },
      enter: ({ y }) => ({ y, opacity: 1 }),
      update: ({ y }) => ({ y }),
      key: (item: Parameter) => item.id,
    }
  );

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.title}>Manifest</Box>
        <Tooltip content={t('parameterListSidebar.removeAllItems')}>
          <IconButton
            disabled={manifest.length === 0}
            size='large'
            onClick={onRemoveAllItems}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
      <MiniList className={classes.list}>
        {transitions(({ y, ...rest }, { id, name, uavId, value }) => (
          <animated.div
            style={{
              transform: y.to((y) => `translate3d(0,${y}px,0)`),
              width: '100%',
              ...rest,
            }}
          >
            <ListItem disablePadding>
              <ListItemButton onClick={() => onRemoveItem(id)}>
                <Box
                  sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    {uavId === undefined ? name : `${name} (${uavId})`}
                  </Box>
                  <Box sx={{ color: 'text.secondary', ml: 1 }}>{value}</Box>
                </Box>
              </ListItemButton>
            </ListItem>
          </animated.div>
        ))}
      </MiniList>
      <Box className={classes.footer}>
        <FileButton
          ref={null}
          startIcon={<FolderOpen />}
          onSelected={onImportItems}
        >
          {t('parameterListSidebar.import')}
        </FileButton>
        <Button
          disabled={!canUpload}
          endIcon={<NavigateNext />}
          onClick={() => {
            void onStart();
          }}
        >
          {t('parameterListSidebar.nextStep')}
        </Button>
      </Box>
    </Box>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canUpload: !isManifestEmpty(state),
    manifest: getParameterManifest(state),
  }),
  // mapDispatchToProps
  {
    onImportItems: importParametersFromFile,
    onRemoveAllItems: clearManifest,
    onRemoveItem: removeParameterFromManifest,
    onStart: proceedToUpload,
  }
)(ParameterListSidebar);
