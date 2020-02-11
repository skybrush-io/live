import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Clear from '@material-ui/icons/Clear';

import FileListItem from './FileListItem';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { loadShowFromFile } from '~/features/show/actions';
import { clearLoadedShow } from '~/features/show/slice';
import {
  getShowDescription,
  getShowTitle,
  hasLoadedShowFile,
  isLoadingShowFile
} from '~/features/show/selectors';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Helper function to test whether a dropped file is a real file and not a
 * directory.
 */
const isFile = item => item && item.size > 0;

/**
 * React component for the button that allows the user to open a show file.
 */
const LoadShowFromFileButton = ({
  description,
  hasLoadedShowFile,
  loading,
  onClearLoadedShow,
  onShowFileSelected,
  status,
  title
}) => (
  <FileListItem
    id="show-file-upload"
    accepts={isFile}
    onSelected={onShowFileSelected}
  >
    <StepperStatusLight status={status} />
    <ListItemText
      disableTypography
      primary={
        loading
          ? 'Please wait, loading show file...'
          : hasLoadedShowFile
          ? title
          : 'No show file loaded'
      }
      secondary={
        <Box
          minHeight={20.1}
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Typography component="div" variant="body2" color="textSecondary">
            {loading ? (
              <LinearProgress />
            ) : hasLoadedShowFile ? (
              description
            ) : (
              'Select or drop a show file here to open it'
            )}
          </Typography>
        </Box>
      }
    />
    {hasLoadedShowFile && (
      <ListItemSecondaryAction>
        <IconButton edge="end" onClick={onClearLoadedShow}>
          <Clear />
        </IconButton>
      </ListItemSecondaryAction>
    )}
  </FileListItem>
);

LoadShowFromFileButton.propTypes = {
  description: PropTypes.string,
  hasLoadedShowFile: PropTypes.bool,
  loading: PropTypes.bool,
  onClearLoadedShow: PropTypes.func,
  onShowFileSelected: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus)),
  title: PropTypes.string
};

export default connect(
  // mapStateToProps
  state => ({
    description: getShowDescription(state),
    hasLoadedShowFile: hasLoadedShowFile(state),
    loading: isLoadingShowFile(state),
    status: getSetupStageStatuses(state).selectShowFile,
    title: getShowTitle(state)
  }),
  // mapDispatchToProps
  {
    onClearLoadedShow: clearLoadedShow,
    onShowFileSelected: loadShowFromFile
  }
)(LoadShowFromFileButton);
