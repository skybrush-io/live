import add from 'date-fns/add';
import format from 'date-fns/format';
import getMinutes from 'date-fns/getMinutes';
import getSeconds from 'date-fns/getSeconds';
import startOfMinute from 'date-fns/startOfMinute';
import PropTypes from 'prop-types';
import React from 'react';
import { useInterval, useUpdate } from 'react-use';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { styled } from '@material-ui/core/styles';

const BorderlessButton = styled(Button)({
  border: [0, '!important'],
});

/**
 * Component that shows suggested start times for the drone swarm, based on the
 * current date/time.
 */
const StartTimeSuggestions = ({ onChange, value, ...rest }) => {
  const update = useUpdate();
  const startTimes = [
    add(startOfMinute(add(Date.now(), { seconds: 30 })), { minutes: 1 }),
  ];
  for (const divisor of [5, 10, 15, 30, 60]) {
    const lastStartTime = startTimes[startTimes.length - 1];
    const lastMinutes = getMinutes(lastStartTime);
    startTimes.push(
      add(lastStartTime, { minutes: divisor - (lastMinutes % divisor) })
    );
  }

  /* re-render every 10 seconds */
  useInterval(update, 10000);

  return (
    <ButtonGroup variant='text' {...rest}>
      {startTimes.map((time, index) => (
        <BorderlessButton
          key={`button${index}`}
          onClick={() => onChange(time.valueOf())}
        >
          {getSeconds(time) === 0
            ? format(time, 'HH:mm')
            : format(time, 'HH:mm:ss')}
        </BorderlessButton>
      ))}
    </ButtonGroup>
  );
};

StartTimeSuggestions.propTypes = {
  onChange: PropTypes.func,
};

export default StartTimeSuggestions;
