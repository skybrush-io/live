import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import MapCachingPanel from './MapCachingPanel';
import { closeMapCachingDialog } from './slice';

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
    <MapCachingPanel onClose={onClose} />
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
