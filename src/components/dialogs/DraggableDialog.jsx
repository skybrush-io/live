import PropTypes from 'prop-types';
import React from 'react';
import Draggable from 'react-draggable';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { createSecondaryAreaStyle } from '~/theme';

import DialogToolbar from './DialogToolbar';

const PaperComponent = (props) => (
  <Draggable
    handle='#draggable-dialog-title'
    cancel={'[class*="MuiDialogContent-root"]'}
  >
    <Paper {...props} />
  </Draggable>
);

const useStyles = makeStyles((theme) => ({
  sidebar: {
    ...createSecondaryAreaStyle(theme, { inset: 'right' }),
  },

  draggableTitle: {
    flex: 1,
    cursor: 'move',
  },
}));

const DraggableDialog = ({
  children,
  sidebarComponents,
  title,
  titleComponents,
  toolbarComponent,
  ...rest
}) => {
  const classes = useStyles();

  const titleTypography = (
    <Typography noWrap variant='subtitle1'>
      {title}
    </Typography>
  );

  const dialogBody = toolbarComponent ? (
    <>
      {typeof toolbarComponent === 'function'
        ? toolbarComponent('draggable-dialog-title')
        : toolbarComponent}
      {children}
    </>
  ) : (
    <>
      {titleComponents ? (
        <DialogToolbar>
          <Box className={classes.draggableTitle} id='draggable-dialog-title'>
            {titleTypography}
          </Box>
          {titleComponents}
        </DialogToolbar>
      ) : (
        <DialogToolbar
          className={classes.draggableTitle}
          id='draggable-dialog-title'
        >
          {titleTypography}
        </DialogToolbar>
      )}
      {children}
    </>
  );

  return (
    <Dialog PaperComponent={PaperComponent} {...rest}>
      {sidebarComponents ? (
        <Box display='flex' flexDirection='row'>
          <Box className={classes.sidebar}>{sidebarComponents}</Box>
          <Box flex={1}>{dialogBody}</Box>
        </Box>
      ) : (
        dialogBody
      )}
    </Dialog>
  );
};

DraggableDialog.propTypes = {
  sidebarComponents: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  title: PropTypes.string,
  titleComponents: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  toolbarComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

export default DraggableDialog;
