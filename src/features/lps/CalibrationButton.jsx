import PropTypes from 'prop-types';
import React from 'react';
import { useAsyncFn } from 'react-use';

import Button from '@material-ui/core/Button';

import { Status } from '@skybrush/app-theme-material-ui';
import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { errorToString } from '~/error-handling';
import { useMessageHub } from '~/hooks';

const CalibrationButton = React.memo(({ lpsId }) => {
  const messageHub = useMessageHub();
  const [calibrationState, startCalibration] = useAsyncFn(
    () => messageHub.execute.triggerLPSCalibration(lpsId),
    [messageHub, lpsId]
  );

  const button = (
    <Button onClick={startCalibration}>
      <LabeledStatusLight
        status={
          calibrationState.loading
            ? Status.NEXT
            : calibrationState.error
            ? Status.ERROR
            : calibrationState.value
            ? Status.SUCCESS
            : Status.OFF
        }
      >
        {calibrationState.loading ? 'Calibrating...' : 'Calibrate'}
      </LabeledStatusLight>
    </Button>
  );

  return calibrationState.error ? (
    <Tooltip content={errorToString(calibrationState.error)}>{button}</Tooltip>
  ) : (
    button
  );
});

CalibrationButton.propTypes = {
  lpsId: PropTypes.string,
};

export default CalibrationButton;
