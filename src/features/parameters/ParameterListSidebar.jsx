import Delete from '@mui/icons-material/Delete';
import FolderOpen from '@mui/icons-material/FolderOpen';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import makeStyles from '@mui/styles/makeStyles';
import { animated, useTransition } from '@react-spring/web';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import FileButton from '~/components/FileButton';

import { importParametersFromFile, proceedToUpload } from './actions';
import { getParameterManifest, isManifestEmpty } from './selectors';
import { clearManifest, removeParameterFromManifest } from './slice';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 240,
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
  }),
  {
    name: 'ParameterListSidebar',
  }
);

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
  t,
}) => {
  const classes = useStyles();

  const ITEM_HEIGHT = 28;
  const transitions = useTransition(
    manifest.map((item, index) => ({ ...item, y: index * ITEM_HEIGHT })),
    {
      from: { position: 'absolute', opacity: 0 },
      leave: { height: 0, opacity: 0 },
      enter: ({ y }) => ({ y, opacity: 1 }),
      update: ({ y }) => ({ y }),
      key: (item) => item.name,
    }
  );

  return (
    <Box className={classes.root}>
      <Box className={classes.header}>
        <Box className={classes.title}>Manifest</Box>
        <Tooltip content={t('parameterListSidebar.removeAllItems')}>
          <IconButton
            disabled={!manifest || manifest.length === 0}
            size='large'
            onClick={onRemoveAllItems}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
      <MiniList className={classes.list}>
        {transitions(({ y, ...rest }, { name, value }) => (
          <animated.div
            style={{
              transform: y.to((y) => `translate3d(0,${y}px,0)`),
              width: '100%',
              ...rest,
            }}
          >
            <ListItemButton onClick={() => onRemoveItem(name)}>
              <Box sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
                <Box sx={{ flexGrow: 1 }}>{name}</Box>
                <Box sx={{ color: 'text.secondary', ml: 1 }}>{value}</Box>
              </Box>
            </ListItemButton>
          </animated.div>
        ))}
      </MiniList>
      <Box className={classes.footer}>
        <FileButton startIcon={<FolderOpen />} onSelected={onImportItems}>
          {t('parameterListSidebar.import')}
        </FileButton>
        <Button
          disabled={!canUpload}
          endIcon={<NavigateNext />}
          onClick={onStart}
        >
          {t('parameterListSidebar.nextStep')}
        </Button>
      </Box>
    </Box>
  );
};

ParameterListSidebar.propTypes = {
  canUpload: PropTypes.bool,
  manifest: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.string,
    })
  ),
  onImportItems: PropTypes.func,
  onRemoveAllItems: PropTypes.func,
  onRemoveItem: PropTypes.func,
  onStart: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
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
)(withTranslation()(ParameterListSidebar));
