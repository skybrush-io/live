/* eslint-disable unicorn/no-negated-condition */
import Clear from '@mui/icons-material/Clear';
import CloudDownload from '@mui/icons-material/CloudDownload';
import Refresh from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import Colors from '~/components/colors';
import FileButton from '~/components/FileButton';
import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import { Status } from '~/components/semantics';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  clearLoadedShow,
  loadShowFromFile,
  reloadCurrentShowFile,
} from '~/features/show/actions';
import {
  getShowDescription,
  getShowLoadingProgressPercentage,
  getShowTitle,
  getShowValidationResult,
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

const isValidationResultAcceptable = (result) =>
  result === 'ok' || result === 'loading' || result === 'notLoaded';

/**
 * Returns a human-readable explanation of why the show validation failed.
 */
const getDescriptionForValidationResult = (validationResult, _t) => {
  switch (validationResult) {
    case 'ok':
    case 'loading':
    case 'notLoaded':
      /* these do not need a description */
      return '';

    case 'loadingFailed':
      return 'Failed to load show';

    case 'takeoffPositionsTooClose':
      return 'Takeoff positions are too close';

    case 'landingPositionsTooClose':
      return 'Landing positions are too close';

    default:
      return 'Show validation failed';
  }
};

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
  validationResult,
}) => (
  <FileButton
    accepts={isFile}
    component={ListItemButton}
    componentProps={{ sx: { paddingRight: 6 } }}
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
        ) : !isValidationResultAcceptable(validationResult) ? (
          <span style={{ color: Colors.warning }}>
            {getDescriptionForValidationResult(validationResult, t)}
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
          <IconButton edge='end' size='large' onClick={onReloadShowFile}>
            <Refresh />
          </IconButton>
        </Tooltip>
      ) : hasLoadedShowFile ? (
        <Tooltip content={t('show.clear', 'Clear loaded show')}>
          <IconButton edge='end' size='large' onClick={onClearLoadedShow}>
            <Clear />
          </IconButton>
        </Tooltip>
      ) : hasFeature('loadShowFromCloud') ? (
        <Tooltip content={t('show.fromCloud', 'Load show from cloud')}>
          <IconButton edge='end' size='large' onClick={onLoadShowFromCloud}>
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
    validationResult: getShowValidationResult(state),
  }),
  // mapDispatchToProps
  {
    onClearLoadedShow: clearLoadedShow,
    onLoadShowFromCloud: openLoadShowFromCloudDialog,
    onReloadShowFile: reloadCurrentShowFile,
    onShowFileSelected: loadShowFromFile,
  }
)(withTranslation()(LoadShowFromFileButton));
