import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Clear from '@material-ui/icons/Clear';
import CloudDownload from '@material-ui/icons/CloudDownload';
import Refresh from '@material-ui/icons/Refresh';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import Colors from '~/components/colors';
import FileButton from '~/components/FileButton';
import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import { Status } from '~/components/semantics';
import {
  clearLoadedShow,
  loadShowFromFile,
  reloadCurrentShowFile,
} from '~/features/show/actions';
import {
  getShowDescription,
  getShowLoadingProgressPercentage,
  getShowTitle,
  hasLoadedShowFile,
  hasShowChangedExternallySinceLoaded,
  isLoadingShowFile,
} from '~/features/show/selectors';
import { openLoadShowFromCloudDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { hasFeature } from '~/utils/configuration';
import { truncate } from '~/utils/formatting';

/**
 * Helper function to test whether a dropped file is a real file and not a
 * directory.
 */
const isFile = (item) => item?.size > 0;

/**
 * List of file extensions that we treat as show files.
 */
const EXTENSIONS = ['.skyc'];

/**
 * React component for the button that allows the user to open a show file.
 */
const LoadShowFromFileButton = ({
  changedSinceLoaded,
  description,
  hasLoadedShowFile,
  loading,
  onClearLoadedShow,
  onLoadShowFromCloud,
  onReloadShowFile,
  onShowFileSelected,
  progress,
  status,
  t,
  title,
}) => (
  <FileButton
    accepts={isFile}
    component={ListItem}
    componentProps={{ button: true }}
    filter={EXTENSIONS}
    id='show-file-upload'
    onSelected={onShowFileSelected}
  >
    <StatusLight status={status} />
    <ListItemTextWithProgress
      primary={
        loading
          ? t('show.loading', 'Please wait, loading show file…')
          : hasLoadedShowFile
          ? truncate(title, 60)
          : t('show.noFileLoaded')
      }
      secondary={
        loading ? (
          <LinearProgress
            value={progress}
            variant={isNil(progress) ? 'indeterminate' : 'determinate'}
          />
        ) : changedSinceLoaded ? (
          <span style={{ color: Colors.warning }}>
            Show changed since it was loaded
          </span>
        ) : hasLoadedShowFile ? (
          description
        ) : (
          t('show.selectFile', 'Select or drop a show file here')
        )
      }
    />
    <ListItemSecondaryAction>
      {changedSinceLoaded ? (
        <Tooltip content={t('show.reload', 'Reload show')}>
          <IconButton edge='end' onClick={onReloadShowFile}>
            <Refresh />
          </IconButton>
        </Tooltip>
      ) : hasLoadedShowFile ? (
        <Tooltip content={t('show.clear', 'Clear loaded show')}>
          <IconButton edge='end' onClick={onClearLoadedShow}>
            <Clear />
          </IconButton>
        </Tooltip>
      ) : hasFeature('loadShowFromCloud') ? (
        <Tooltip content={t('show.fromCloud', 'Load show from cloud')}>
          <IconButton edge='end' onClick={onLoadShowFromCloud}>
            <CloudDownload />
          </IconButton>
        </Tooltip>
      ) : null}
    </ListItemSecondaryAction>
  </FileButton>
);

LoadShowFromFileButton.propTypes = {
  changedSinceLoaded: PropTypes.bool,
  description: PropTypes.string,
  hasLoadedShowFile: PropTypes.bool,
  loading: PropTypes.bool,
  onClearLoadedShow: PropTypes.func,
  onLoadShowFromCloud: PropTypes.func,
  onReloadShowFile: PropTypes.func,
  onShowFileSelected: PropTypes.func,
  progress: PropTypes.number,
  status: PropTypes.oneOf(Object.values(Status)),
  t: PropTypes.func,
  title: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    changedSinceLoaded: hasShowChangedExternallySinceLoaded(state),
    description: getShowDescription(state),
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
    onReloadShowFile: reloadCurrentShowFile,
    onShowFileSelected: loadShowFromFile,
  }
)(withTranslation()(LoadShowFromFileButton));
