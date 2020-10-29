import PropTypes from 'prop-types';
import React from 'react';
import Draggable from 'react-draggable';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import DialogToolbar from './DialogToolbar';

const PaperComponent = (props) => (
  <Draggable
    handle='#draggable-dialog-title'
    cancel={'[class*="MuiDialogContent-root"]'}
  >
    <Paper {...props} />
  </Draggable>
);

const style = {
  cursor: 'move',
};

const DraggableDialog = ({ children, title, titleComponents, ...rest }) => {
  const titleTypography = (
    <Typography noWrap variant='subtitle1'>
      {title}
    </Typography>
  );

  return (
    <Dialog PaperComponent={PaperComponent} {...rest}>
      {titleComponents ? (
        <DialogToolbar>
          <Box id='draggable-dialog-title' flex={1} style={style}>
            {titleTypography}
          </Box>
          {titleComponents}
        </DialogToolbar>
      ) : (
        <DialogToolbar style={style} id='draggable-dialog-title'>
          {titleTypography}
        </DialogToolbar>
      )}
      {children}
    </Dialog>
  );
};

DraggableDialog.propTypes = {
  title: PropTypes.string,
  titleComponents: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

export default DraggableDialog;
