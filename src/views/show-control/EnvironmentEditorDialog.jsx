import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { getShowEnvironmentType } from '~/features/show/selectors';
import { closeEnvironmentEditorDialog } from '~/features/show/slice';

import IndoorEnvironmentEditor from './IndoorEnvironmentEditor';
import OutdoorEnvironmentEditor from './OutdoorEnvironmentEditor';

const instructionsByType = {
  indoor: 'environmentEditorDialog.indoor',
  outdoor: 'environmentEditorDialog.outdoor',
};

const Instructions = withTranslation()(({ type, t }) => (
  <Typography variant='body1'>{t(instructionsByType[type])}</Typography>
));

Instructions.propTypes = {
  type: PropTypes.oneOf(Object.keys(instructionsByType)),
};

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the environment settings of a drone show.
 */
const EnvironmentEditorDialog = ({ editing = false, onClose, type, t }) => (
  <DraggableDialog
    fullWidth
    open={editing}
    maxWidth='sm'
    title={t('environmentEditorDialog.environmentSettings')}
    onClose={onClose}
  >
    <DialogContent>
      <Box>
        <Instructions type={type} />
        {type === 'outdoor' && <OutdoorEnvironmentEditor />}
        {type === 'indoor' && <IndoorEnvironmentEditor />}
      </Box>
    </DialogContent>
  </DraggableDialog>
);

EnvironmentEditorDialog.propTypes = {
  editing: PropTypes.bool,
  onClose: PropTypes.func,
  type: PropTypes.oneOf(['indoor', 'outdoor']),
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    editing: state.show.environment.editing,
    type: getShowEnvironmentType(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeEnvironmentEditorDialog,
  }
)(withTranslation()(EnvironmentEditorDialog));
