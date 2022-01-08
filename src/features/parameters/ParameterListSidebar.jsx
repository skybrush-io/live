import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { animated, useTransition } from 'react-spring';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import { makeStyles } from '@material-ui/core/styles';
import Delete from '@material-ui/icons/Delete';
import PlayArrow from '@material-ui/icons/PlayArrow';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { getParameterManifest, isManifestEmpty } from './selectors';
import { clearManifest, removeParameterFromManifest } from './slice';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 185,
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
    },

    footer: {
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
        <Button
          fullWidth
          disabled={!canUpload}
          startIcon={<PlayArrow />}
          onClick={onStart}
        >
          Start upload
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
    onRemoveAllItems: clearManifest,
    onRemoveItem: removeParameterFromManifest,
  }
)(ParameterListSidebar);
