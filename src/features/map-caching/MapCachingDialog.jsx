import { DialogContent } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import MapCachingPanel from './MapCachingPanel';
import { closeMapCachingDialog } from './slice';

const noPaddingStyle = { padding: 0 };

/**
 * Presentation component for the dialog that allows the user to adjust the
 * settings related to map caching on the server.
 */
const MapCachingDialog = ({ onClose, open, t }) => (
  <DraggableDialog
    fullWidth
    open={open}
    maxWidth='xs'
    title={t('mapCachingDialog.offlineMaps')}
    onClose={onClose}
  >
    <DialogContent sx={noPaddingStyle}>
      <MapCachingPanel onClose={onClose} />
    </DialogContent>
  </DraggableDialog>
);

MapCachingDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.mapCaching.dialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeMapCachingDialog,
  }
)(withTranslation()(MapCachingDialog));
