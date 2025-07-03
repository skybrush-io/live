import Clear from '@mui/icons-material/Clear';
import LocalShipping from '@mui/icons-material/LocalShipping';
import Visibility from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { getCurrentUploadJob, getSelectedJobInUploadDialog } from './selectors';
import { cancelUpload, openUploadDialogForJob } from './slice';

type AnotherJobTypeRunningHintProps = Readonly<{
  type: string;
}>;

const AnotherJobTypeRunningHint = (
  _props: AnotherJobTypeRunningHintProps
): JSX.Element => {
  const dispatch = useDispatch();
  const currentJob = useSelector(getCurrentUploadJob);
  const selectedJob = useSelector(getSelectedJobInUploadDialog);

  return (
    <BackgroundHint
      icon={<LocalShipping />}
      header='Another task is in progress'
      text='Wait for the other task to finish or cancel it to start a new upload'
      button={
        <>
          <Button
            startIcon={<Clear />}
            onClick={() => {
              dispatch(cancelUpload());
            }}
          >
            Cancel upload
          </Button>
          <Box display='inline-block' mx={1} />
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
            View progress
          </Button>
        </>
      }
    />
  );
};

export default AnotherJobTypeRunningHint;
