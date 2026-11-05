import Clear from '@mui/icons-material/Clear';
import CloudDownload from '@mui/icons-material/CloudDownload';
import Refresh from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import isNil from 'lodash-es/isNil';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { Status } from '@skybrush/app-theme-mui';
import { StatusLight } from '@skybrush/mui-components';

import Colors from '~/components/colors';
import FileButton from '~/components/FileButton';
import ListItemTextWithProgress from '~/components/progress/ListItemTextWithProgress';
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
import type { ShowValidationResult } from '~/features/show/selectors/types';
import { openLoadShowFromCloudDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import type { RootState } from '~/store/reducers';
import { hasFeature } from '~/utils/configuration';
import { truncate } from '~/utils/formatting';

/**
 * Helper function to test whether a dropped file is a real file and not a
 * directory.
 */
const isFile = (file: File | undefined) => (file ? file.size > 0 : false);

/**
 * List of file extensions that we treat as show files.
 */
const EXTENSIONS = ['.skyc'];

const isValidationResultAcceptable = (result: ShowValidationResult) =>
  result === 'ok' || result === 'loading' || result === 'notLoaded';

/**
 * Returns a human-readable explanation of why the show validation failed.
 */
const getDescriptionForValidationResult = (validationResult: string) => {
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

type Props = {
  changedSinceLoaded: boolean;
  description?: string;
  hasLoadedShowFile: boolean;
  loading: boolean;
  onClearLoadedShow: () => void;
  onLoadShowFromCloud: () => void;
  onReloadShowFile: () => void;
  onShowFileSelected: (file: File) => void;
  progress?: number | null;
  status?: Status;
  title?: string;
  validationResult: ShowValidationResult;
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
  title,
  validationResult,
}: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem
      disablePadding
      secondaryAction={
        changedSinceLoaded ? (
          <Tooltip content={t('show.reload')}>
            <IconButton edge='end' size='large' onClick={onReloadShowFile}>
              <Refresh />
            </IconButton>
          </Tooltip>
        ) : hasLoadedShowFile ? (
          <Tooltip content={t('show.clear')}>
            <IconButton edge='end' size='large' onClick={onClearLoadedShow}>
              <Clear />
            </IconButton>
          </Tooltip>
        ) : hasFeature('loadShowFromCloud') ? (
          <Tooltip content={t('show.fromCloud')}>
            <IconButton edge='end' size='large' onClick={onLoadShowFromCloud}>
              <CloudDownload />
            </IconButton>
          </Tooltip>
        ) : undefined
      }
    >
      <FileButton
        accepts={isFile}
        component={ListItemButton}
        componentProps={{ sx: { paddingRight: 2 } }}
        filter={EXTENSIONS}
        id='show-file-upload'
        onSelected={onShowFileSelected}
      >
        <StatusLight status={status} />
        <ListItemTextWithProgress
          primary={
            loading
              ? t('show.loading')
              : hasLoadedShowFile
                ? truncate(title ?? '', 60)
                : t('show.noFileLoaded')
          }
          secondary={
            loading ? (
              <LinearProgress
                value={progress ?? undefined}
                variant={isNil(progress) ? 'indeterminate' : 'determinate'}
              />
            ) : changedSinceLoaded ? (
              <span style={{ color: Colors.warning }}>
                {t('show.changedSinceLoaded')}
              </span>
            ) : !isValidationResultAcceptable(validationResult) ? (
              <span style={{ color: Colors.warning }}>
                {getDescriptionForValidationResult(validationResult)}
              </span>
            ) : hasLoadedShowFile ? (
              description
            ) : (
              t('show.selectFile')
            )
          }
        />
      </FileButton>
    </ListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
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
)(LoadShowFromFileButton);
