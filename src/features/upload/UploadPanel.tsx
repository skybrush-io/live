import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type React from 'react';
import { createElement } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import type { RootState } from '~/store/reducers';

import UploadStatusLights from './UploadStatusLights';
import { getUploadJobResultPanel } from './result-panels';
import { getSelectedTabInUploadDialog } from './selectors';
import { setUploadDialogSelectedTab } from './slice';
import type { UploadDialogTab } from './types';

const useStyles = makeStyles({
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
});

type UploadPanelProps = Readonly<{
  jobType: string;
  onTabSelected: (value: UploadDialogTab) => void;
  selectedTab: UploadDialogTab;
}>;

/**
 * Presentation component for the main panel that allows the user to monitor the
 * status of an upload job.
 */
const UploadPanel = ({
  jobType,
  onTabSelected,
  selectedTab,
}: UploadPanelProps): React.JSX.Element => {
  const classes = useStyles();
  const { t } = useTranslation();
  const resultPanel = getUploadJobResultPanel(jobType);
  const supportsResults = resultPanel !== undefined;

  return (
    <>
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
    </>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    selectedTab: getSelectedTabInUploadDialog(state),
  }),

  // mapDispatchToProps
  {
    onTabSelected: setUploadDialogSelectedTab,
  }
)(UploadPanel);
