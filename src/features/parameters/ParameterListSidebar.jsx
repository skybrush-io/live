import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { animated, useTransition } from '@react-spring/web';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import { makeStyles } from '@material-ui/core/styles';
import Delete from '@material-ui/icons/Delete';
import FolderOpen from '@material-ui/icons/FolderOpen';
import NavigateNext from '@material-ui/icons/NavigateNext';

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
        <Tooltip content='Remove all items from manifest'>
          <IconButton
            disabled={!manifest || manifest.length === 0}
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
            <ListItem button onClick={() => onRemoveItem(name)}>
              <Box display='flex' flexDirection='row' flexGrow={1}>
                <Box flexGrow={1}>{name}</Box>
                <Box color='text.secondary' ml={1}>
                  {value}
                </Box>
              </Box>
            </ListItem>
          </animated.div>
        ))}
      </MiniList>
      <Box className={classes.footer}>
        <FileButton startIcon={<FolderOpen />} onSelected={onImportItems}>
          Import...
        </FileButton>
        <Button
          disabled={!canUpload}
          endIcon={<NavigateNext />}
          onClick={onStart}
        >
          Next step
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
)(ParameterListSidebar);
