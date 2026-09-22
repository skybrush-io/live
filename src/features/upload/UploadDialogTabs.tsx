import { DialogTabs, type DialogTabsProps } from '@skybrush/mui-components';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~/store/hooks';

import Tab from '@mui/material/Tab';
import { useTranslation } from 'react-i18next';
import RestrictToGlobalSelectionSwitch from './RestrictToGlobalSelectionSwitch';
import { getSelectedTabInUploadDialog } from './selectors';
import { setUploadDialogSelectedTab } from './slice';
import type { UploadDialogTab } from './types';

const UploadDialogTabs = (props: DialogTabsProps) => {
  const { t } = useTranslation();
  const selectedTab = useSelector(getSelectedTabInUploadDialog);
  const dispatch = useAppDispatch();

  return (
    <DialogTabs
      value={selectedTab}
      onChange={(_event, value: UploadDialogTab) => {
        dispatch(setUploadDialogSelectedTab(value));
      }}
      {...props}
      extraComponents={<RestrictToGlobalSelectionSwitch />}
    >
      <Tab value='status' label={t('uploadPanel.statusTab')} />
      <Tab value='results' label={t('uploadPanel.resultsTab')} />
    </DialogTabs>
  );
};

export default UploadDialogTabs;
