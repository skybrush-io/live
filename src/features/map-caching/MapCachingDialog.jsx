import { DialogContent } from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import MapCachingPanel from './MapCachingPanel';
import { closeMapCachingDialog } from './slice';

const noPaddingStyle = { padding: 0 };

/**
 * Presentation component for the dialog that allows the user to adjust the
 * settings related to map caching on the server.
 */
const MapCachingDialog = ({ onClose, open }) => {
  const { t } = useTranslation();

  return (
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
};

MapCachingDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
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
)(MapCachingDialog);
