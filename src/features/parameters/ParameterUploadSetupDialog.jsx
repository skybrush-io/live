import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { makeStyles } from '@material-ui/core/styles';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import ParameterListSidebar from './ParameterListSidebar';
import ParameterUploadMainPanel from './ParameterUploadMainPanel';
import { isParameterUploadSetupDialogOpen } from './selectors';
import { closeParameterUploadSetupDialog } from './slice';

/* Ugly hack to move the sidebar to the right */
const useStyles = makeStyles(
  {
    root: {
      '& div.MuiDialog-paper > div > div:first-child': {
        order: 100,
        boxShadow: '2px 0 6px -2px inset rgba(0, 0, 0, 0.54)',
      },
    },
  },
  {
    name: 'ParameterUploadSetupDialog',
  }
);

/**
 * Presentation component for the dialog that allows the user to assemble a
 * list of parameters to upload to the drones.
 */
const ParameterUploadSetupDialog = ({ onClose, open, t }) => {
  const classes = useStyles();

  return (
    <DraggableDialog
      fullWidth
      className={classes.root}
      open={open}
      maxWidth='md'
      sidebarComponents={<ParameterListSidebar />}
      title={t('parameterUploadSetupDialog.uploadParameters')}
      onClose={onClose}
    >
      <DialogContent>
        <ParameterUploadMainPanel />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('general.action.close')}</Button>
      </DialogActions>
    </DraggableDialog>
  );
};

ParameterUploadSetupDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: isParameterUploadSetupDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeParameterUploadSetupDialog,
  }
)(withTranslation()(ParameterUploadSetupDialog));
