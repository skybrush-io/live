import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Clear from '@material-ui/icons/Clear';
import CloudDownload from '@material-ui/icons/CloudDownload';

import FileListItem from './FileListItem';

import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { loadShowFromFile } from '~/features/show/actions';
import {
  clearLoadedShow,
  openLoadShowFromCloudDialog
} from '~/features/show/slice';
import {
  getShowDescription,
  getShowLoadingProgressPercentage,
  getShowTitle,
  hasLoadedShowFile,
  isLoadingShowFile
} from '~/features/show/selectors';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Helper function to test whether a dropped file is a real file and not a
 * directory.
 */
const isFile = (item) => item && item.size > 0;

/**
 * React component for the button that allows the user to open a show file.
 */
const LoadShowFromFileButton = ({
  description,
  hasLoadedShowFile,
  loading,
  onClearLoadedShow,
  onLoadShowFromCloud,
  onShowFileSelected,
  progress,
  status,
  title
}) => (
  <FileListItem
    id="show-file-upload"
    accepts={isFile}
    onSelected={onShowFileSelected}
  >
    <StepperStatusLight status={status} />
    <ListItemTextWithProgress
      primary={
        loading
          ? 'Please wait, loading show file…'
          : hasLoadedShowFile
          ? title
          : 'No show file loaded'
      }
      secondary={
        loading ? (
          <LinearProgress
            value={progress}
            variant={!isNil(progress) ? 'determinate' : 'indeterminate'}
          />
        ) : hasLoadedShowFile ? (
          description
        ) : (
          'Select or drop a show file here'
        )
      }
    />
    <ListItemSecondaryAction>
      {hasLoadedShowFile ? (
        <IconButton edge="end" onClick={onClearLoadedShow}>
          <Clear />
        </IconButton>
      ) : (
        <IconButton edge="end" onClick={onLoadShowFromCloud}>
          <CloudDownload />
        </IconButton>
      )}
    </ListItemSecondaryAction>
  </FileListItem>
);

LoadShowFromFileButton.propTypes = {
  description: PropTypes.string,
  hasLoadedShowFile: PropTypes.bool,
  loading: PropTypes.bool,
  onClearLoadedShow: PropTypes.func,
  onLoadShowFromCloud: PropTypes.func,
  onShowFileSelected: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus)),
  title: PropTypes.string
};

export default connect(
  // mapStateToProps
  (state) => ({
    description: getShowDescription(state),
    hasLoadedShowFile: hasLoadedShowFile(state),
    loading: isLoadingShowFile(state),
    progress: getShowLoadingProgressPercentage(state),
    status: getSetupStageStatuses(state).selectShowFile,
    title: getShowTitle(state)
  }),
  // mapDispatchToProps
  {
    onClearLoadedShow: clearLoadedShow,
    onLoadShowFromCloud: openLoadShowFromCloudDialog,
    onShowFileSelected: loadShowFromFile
  }
)(LoadShowFromFileButton);
