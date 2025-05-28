import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { styled } from '@mui/material/styles';
import add from 'date-fns/add';
import format from 'date-fns/format';
import getMinutes from 'date-fns/getMinutes';
import getSeconds from 'date-fns/getSeconds';
import startOfMinute from 'date-fns/startOfMinute';
import React from 'react';

import usePeriodicRefresh from '~/hooks/usePeriodicRefresh';

// TODO(mui): migrate to emotion
const BorderlessButton = styled(Button)({
  border: '0 !important',
  textTransform: 'none',
});

export type StartTimeSuggestion =
  | {
      time: number;
      relative: true;
    }
  | {
      time: Date;
      relative: false;
    };

export const createStartTimeSuggestionsFn = ({
  relativeIntervals = [],
  divisors = [],
}: {
  relativeIntervals?: number[];
  divisors?: number[];
} = {}) => {
  return (now: number): StartTimeSuggestion[] => {
    let lastProposedAbsoluteDate = add(
      startOfMinute(add(now, { seconds: 30 })),
      {
        minutes: 2,
      }
    );

    const result: StartTimeSuggestion[] = relativeIntervals.map(
      (diff): StartTimeSuggestion => ({ time: diff, relative: true })
    );

    if (divisors.length > 0) {
      result.push({
        time: lastProposedAbsoluteDate,
        relative: false,
      });

      for (const divisor of divisors) {
        const lastMinutes = getMinutes(lastProposedAbsoluteDate);
        const newProposedAbsoluteDate = add(lastProposedAbsoluteDate, {
          minutes: divisor - (lastMinutes % divisor),
        });
        result.push({ time: newProposedAbsoluteDate, relative: false });
        lastProposedAbsoluteDate = newProposedAbsoluteDate;
      }
    }

    return result;
  };
};

const defaultCreateStartTimeSuggestions = createStartTimeSuggestionsFn({
  relativeIntervals: [15, 30, 60],
  divisors: [5, 15, 30, 60],
});

export type StartTimeSuggestionsProps = {
  readonly onChange: (suggestion: StartTimeSuggestion) => void;
  readonly startTimes?:
    | StartTimeSuggestion[]
    | ((now: number) => StartTimeSuggestion[]);
};

/**
 * Component that shows suggested start times for the drone swarm, based on the
 * current date/time.
 */
const StartTimeSuggestions = ({
  onChange,
  startTimes = defaultCreateStartTimeSuggestions,
  ...rest
}: StartTimeSuggestionsProps): JSX.Element => {
  const items =
    typeof startTimes === 'function' ? startTimes(Date.now()) : startTimes;

  /* re-render every 10 seconds */
  usePeriodicRefresh(10000);

  return (
    <ButtonGroup variant='text' {...rest}>
      {items.map((suggestion, index) => (
        /* eslint-disable react/no-array-index-key */
        <BorderlessButton
          key={`button${index}`}
          onClick={() => {
            onChange(suggestion);
          }}
        >
          {suggestion.relative
            ? `${suggestion.time > 0 ? '+' : ''}${suggestion.time}s`
            : getSeconds(suggestion.time) === 0
              ? format(suggestion.time, 'HH:mm')
              : format(suggestion.time, 'HH:mm:ss')}
        </BorderlessButton>
        /* eslint-enable react/no-array-index-key */
      ))}
    </ButtonGroup>
  );
};

export default StartTimeSuggestions;
