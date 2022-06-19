import add from 'date-fns/add';
import format from 'date-fns/format';
import getMinutes from 'date-fns/getMinutes';
import getSeconds from 'date-fns/getSeconds';
import startOfMinute from 'date-fns/startOfMinute';
import startOfSecond from 'date-fns/startOfSecond';
import PropTypes from 'prop-types';
import React from 'react';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { styled } from '@material-ui/core/styles';

import { usePeriodicRefresh } from '~/hooks';

const BorderlessButton = styled(Button)({
  border: [0, '!important'],
  textTransform: ['none', '!important'],
});

const createStartTimeSuggestions = () => {
  const result = [
    {
      time: 15,
      relative: true,
    },
    {
      time: 30,
      relative: true,
    },
    {
      time: 60,
      relative: true,
    },
    {
      time: add(startOfMinute(add(Date.now(), { seconds: 30 })), {
        minutes: 2,
      }),
    },
  ];

  for (const divisor of [5, 15, 30, 60]) {
    const lastStartTime = result[result.length - 1].time;
    const lastMinutes = getMinutes(lastStartTime);
    result.push({
      time: add(lastStartTime, { minutes: divisor - (lastMinutes % divisor) }),
    });
  }

  return result;
};

/**
 * Component that shows suggested start times for the drone swarm, based on the
 * current date/time.
 */
const StartTimeSuggestions = ({ onChange, ...rest }) => {
  const startTimes = createStartTimeSuggestions();

  /* re-render every 10 seconds */
  usePeriodicRefresh(10000);

  return (
    <ButtonGroup variant='text' {...rest}>
      {startTimes.map(({ time, relative }, index) => (
        /* eslint-disable react/no-array-index-key */
        <BorderlessButton
          key={`button${index}`}
          onClick={() =>
            onChange(
              relative
                ? startOfSecond(add(Date.now(), { seconds: time }))
                : time.valueOf()
            )
          }
        >
          {relative
            ? `${time > 0 ? '+' : ''}${time}s`
            : getSeconds(time) === 0
            ? format(time, 'HH:mm')
            : format(time, 'HH:mm:ss')}
        </BorderlessButton>
        /* eslint-enable react/no-array-index-key */
      ))}
    </ButtonGroup>
  );
};

StartTimeSuggestions.propTypes = {
  onChange: PropTypes.func,
};

export default StartTimeSuggestions;
