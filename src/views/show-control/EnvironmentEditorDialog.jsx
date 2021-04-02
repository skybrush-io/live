import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { getShowEnvironmentType } from '~/features/show/selectors';
import { closeEnvironmentEditorDialog } from '~/features/show/slice';

import IndoorEnvironmentEditor from './IndoorEnvironmentEditor';
import OutdoorEnvironmentEditor from './OutdoorEnvironmentEditor';

const instructionsByType = {
  indoor:
    'This show is an indoor show. You may specify the corners of the room ' +
    'in which the show is taking place (for visualisation purposes).',
  outdoor:
    'This show is an outdoor show. You need to specify at least ' +
    'the origin and orientation of the coordinate system so Skybrush can map ' +
    'the show into GPS coordinates.',
};

const Instructions = ({ type }) => (
  <Typography variant='body1'>{instructionsByType[type]}</Typography>
);

Instructions.propTypes = {
  type: PropTypes.oneOf(Object.keys(instructionsByType)),
};

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the environment settings of a drone show.
 */
const EnvironmentEditorDialog = ({ editing, onClose, type }) => (
  <DraggableDialog
    fullWidth
    open={editing}
    maxWidth='sm'
    title='Environment settings'
    onClose={onClose}
  >
    <DialogContent>
      <Box my={2}>
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
};

EnvironmentEditorDialog.defaultProps = {
  editing: false,
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
)(EnvironmentEditorDialog);
