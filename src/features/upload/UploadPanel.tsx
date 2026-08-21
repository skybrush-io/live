import NavigateBack from '@mui/icons-material/NavigateBefore';
import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { Theme } from '@mui/material/styles';
import type React from 'react';
import { createElement } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { createSecondaryAreaStyle, makeStyles } from '@skybrush/app-theme-mui';

import type { RootState } from '~/store/reducers';

import { DialogActions } from '@mui/material';
import CancelUploadButton from './CancelUploadButton';
import ClearUploadHistoryButton from './ClearUploadHistoryButton';
import HiddenTargetsWarning from './HiddenTargetsWarning';
import StartUploadButton from './StartUploadButton';
import UploadProgressBar from './UploadProgressBar';
import UploadResultIndicator from './UploadResultIndicator';
import UploadSettings from './UploadSettings';
import UploadStatusLegend from './UploadStatusLegend';
import UploadStatusLights from './UploadStatusLights';
import { getUploadJobResultPanel } from './result-panels';
import {
  getSelectedTabInUploadDialog,
  getUploadDialogState,
  isUploadInProgress,
} from './selectors';
import {
  closeUploadDialog,
  dismissLastUploadResult,
  setUploadDialogSelectedTab,
} from './slice';
import type { UploadDialogTab } from './types';

const useStyles = makeStyles((theme: Theme) => ({
  bottomArea: {
    ...createSecondaryAreaStyle(theme, { inset: 'top' }),
    padding: theme.spacing(1, 3, 1, 3),
  },
  uploadResultIndicator: {
    flex: 1,
    cursor: 'pointer',
  },
  tabs: {
    minHeight: 0,
  },
  tab: {
    minHeight: 36,
  },
  activeTabPanel: {
    display: 'block',
  },
  inactiveTabPanel: {
    display: 'none',
  },
}));

type UploadPanelProps = Readonly<{
  jobType: string;
  onDismissLastUploadResult: () => void;
  onTabSelected: (value: UploadDialogTab) => void;
  onStepBack?: () => void;
  running?: boolean;
  showLastUploadResult?: boolean;
  selectedTab?: UploadDialogTab;
}>;

/**
 * Presentation component for the main panel that allows the user to monitor the
 * status of an upload job.
 */
const UploadPanel = ({
  jobType,
  onDismissLastUploadResult,
  onTabSelected,
  onStepBack,
  running = false,
  showLastUploadResult = false,
  selectedTab = 'status',
}: UploadPanelProps): React.JSX.Element => {
  const classes = useStyles();
  const { t } = useTranslation();
  const resultPanel = getUploadJobResultPanel(jobType);
  const supportsResults = resultPanel !== undefined;

  return (
    <>
      <DialogContent>
        {supportsResults && (
          <Tabs
            value={selectedTab}
            onChange={(_event, value: UploadDialogTab) => {
              onTabSelected(value);
            }}
            className={classes.tabs}
          >
            <Tab
              value='status'
              label={t('uploadPanel.statusTab')}
              className={classes.tab}
            />
            <Tab
              value='results'
              label={t('uploadPanel.resultsTab')}
              className={classes.tab}
            />
          </Tabs>
        )}
        {supportsResults ? (
          <>
            <Box
              className={
                selectedTab === 'status'
                  ? classes.activeTabPanel
                  : classes.inactiveTabPanel
              }
            >
              <UploadStatusLights />
            </Box>
            {resultPanel && (
              <Box
                className={
                  selectedTab === 'results'
                    ? classes.activeTabPanel
                    : classes.inactiveTabPanel
                }
              >
                {createElement(resultPanel)}
              </Box>
            )}
          </>
        ) : (
          <UploadStatusLights />
        )}
      </DialogContent>
      <Stack className={classes.bottomArea}>
        <UploadStatusLegend />
        <UploadProgressBar />
        <UploadSettings />
        <HiddenTargetsWarning />
        <DialogActions sx={{ p: 0, mt: 1 }}>
          {onStepBack && (
            <IconButton size='small' edge='start' onClick={onStepBack}>
              <NavigateBack />
            </IconButton>
          )}
          <Fade in={showLastUploadResult || running}>
            <Box
              className={classes.uploadResultIndicator}
              onClick={onDismissLastUploadResult}
            >
              <UploadResultIndicator jobType={jobType} />
            </Box>
          </Fade>
          {!running && <ClearUploadHistoryButton />}
          {selectedTab === 'status' &&
            (running ? <CancelUploadButton /> : <StartUploadButton />)}
        </DialogActions>
      </Stack>
    </>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...getUploadDialogState(state),
    running: isUploadInProgress(state),
    selectedTab: getSelectedTabInUploadDialog(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    onDismissLastUploadResult: dismissLastUploadResult,
    onTabSelected: setUploadDialogSelectedTab,
  }
)(UploadPanel);
