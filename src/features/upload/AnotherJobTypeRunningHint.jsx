import React from 'react';
import { useDispatch } from 'react-redux';

import Button from '@material-ui/core/Button';
import LocalShipping from '@material-ui/icons/LocalShipping';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { cancelUpload } from '~/features/upload/slice';

const AnotherJobTypeRunningHint = () => {
  const dispatch = useDispatch();

  return (
    <BackgroundHint
      icon={<LocalShipping />}
      header='Another task is in progress'
      text='Wait for the other task to finish or cancel it to start a new upload'
      button={
        <Button
          onClick={() => {
            dispatch(cancelUpload());
          }}
        >
          Cancel upload
        </Button>
      }
    />
  );
};

AnotherJobTypeRunningHint.propTypes = {
  // type: PropTypes.string,
};

export default AnotherJobTypeRunningHint;
