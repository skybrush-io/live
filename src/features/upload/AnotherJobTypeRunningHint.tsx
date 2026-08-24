import Clear from '@mui/icons-material/Clear';
import LocalShipping from '@mui/icons-material/LocalShipping';
import Visibility from '@mui/icons-material/Visibility';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import type React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BackgroundHint } from '@skybrush/mui-components';

import { useTranslation } from 'react-i18next';
import { getCurrentUploadJob, getSelectedJobInUploadDialog } from './selectors';
import { cancelUpload, openUploadDialogForJob } from './slice';

type AnotherJobTypeRunningHintProps = Readonly<{
  type: string;
}>;

const AnotherJobTypeRunningHint = (
  _props: AnotherJobTypeRunningHintProps
): React.JSX.Element => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentJob = useSelector(getCurrentUploadJob);
  const selectedJob = useSelector(getSelectedJobInUploadDialog);

  return (
    <BackgroundHint
      icon={<LocalShipping />}
      header={t('uploadDialog.anotherJobTypeRunningHint.header')}
      text={t('uploadDialog.anotherJobTypeRunningHint.text')}
      button={
        <Stack direction='row' spacing={1} justifyContent='center'>
          <Button
            startIcon={<Clear />}
            onClick={() => {
              dispatch(cancelUpload());
            }}
          >
            {t('uploadDialog.anotherJobTypeRunningHint.cancelButton')}
          </Button>
          <Button
            startIcon={<Visibility />}
            onClick={() => {
              dispatch(
                openUploadDialogForJob({
                  job: currentJob,
                  options: {
                    backAction: openUploadDialogForJob({ job: selectedJob }),
                  },
                })
              );
            }}
          >
            {t('uploadDialog.anotherJobTypeRunningHint.viewProgressButton')}
          </Button>
        </Stack>
      }
    />
  );
};

export default AnotherJobTypeRunningHint;
