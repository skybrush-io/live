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

import Colors from '~/components/colors';
import FileWatcher from '~/components/FileWatcher';
import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import StatusLight from '~/components/StatusLight';
import { Status } from '~/components/semantics';
import Tooltip from '~/components/Tooltip';
import { loadShowFromFile } from '~/features/show/actions';
import {
  clearLoadedShow,
  notifyShowFileChangedSinceLoaded,
  openLoadShowFromCloudDialog,
} from '~/features/show/slice';
import {
  getShowDescription,
  getAbsolutePathOfShowFile,
  getShowLoadingProgressPercentage,
  getShowTitle,
  hasShowChangedExternallySinceLoaded,
  hasLoadedShowFile,
  isLoadingShowFile,
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
  changedSinceLoaded,
  description,
  filename,
  hasLoadedShowFile,
  loading,
  onClearLoadedShow,
  onLoadShowFromCloud,
  onShowFileChangedExternally,
  onShowFileSelected,
  progress,
  status,
  title,
}) => (
  <FileListItem
    id='show-file-upload'
    inputId='show-file-upload-input'
    accepts={isFile}
    onSelected={onShowFileSelected}
  >
    <FileWatcher filename={filename} onChanged={onShowFileChangedExternally} />
    <StatusLight status={status} />
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
        ) : changedSinceLoaded ? (
          <span style={{ color: Colors.warning }}>
            Show changed, click to reload
          </span>
        ) : hasLoadedShowFile ? (
          description
        ) : (
          'Select or drop a show file here'
        )
      }
    />
    <ListItemSecondaryAction>
      {hasLoadedShowFile ? (
        <Tooltip content='Clear loaded show'>
          <IconButton edge='end' onClick={onClearLoadedShow}>
            <Clear />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip content='Load show from cloud'>
          <IconButton edge='end' onClick={onLoadShowFromCloud}>
            <CloudDownload />
          </IconButton>
        </Tooltip>
      )}
    </ListItemSecondaryAction>
  </FileListItem>
);

LoadShowFromFileButton.propTypes = {
  changedSinceLoaded: PropTypes.bool,
  description: PropTypes.string,
  filename: PropTypes.string,
  hasLoadedShowFile: PropTypes.bool,
  loading: PropTypes.bool,
  onClearLoadedShow: PropTypes.func,
  onLoadShowFromCloud: PropTypes.func,
  onShowFileChangedExternally: PropTypes.func,
  onShowFileSelected: PropTypes.func,
  progress: PropTypes.number,
  status: PropTypes.oneOf(Object.values(Status)),
  title: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    changedSinceLoaded: hasShowChangedExternallySinceLoaded(state),
    description: getShowDescription(state),
    filename: getAbsolutePathOfShowFile(state),
    hasLoadedShowFile: hasLoadedShowFile(state),
    loading: isLoadingShowFile(state),
    progress: getShowLoadingProgressPercentage(state),
    status: getSetupStageStatuses(state).selectShowFile,
    title: getShowTitle(state),
  }),
  // mapDispatchToProps
  {
    onClearLoadedShow: clearLoadedShow,
    onLoadShowFromCloud: openLoadShowFromCloudDialog,
    onShowFileChangedExternally: notifyShowFileChangedSinceLoaded,
    onShowFileSelected: loadShowFromFile,
  }
)(LoadShowFromFileButton);
