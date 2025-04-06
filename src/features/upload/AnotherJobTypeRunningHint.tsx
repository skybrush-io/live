import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import Clear from '@material-ui/icons/Clear';
import LocalShipping from '@material-ui/icons/LocalShipping';
import Visibility from '@material-ui/icons/Visibility';

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
