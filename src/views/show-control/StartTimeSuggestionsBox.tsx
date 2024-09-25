import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import StartTimeSuggestions, {
  type StartTimeSuggestionsProps,
} from './StartTimeSuggestions';

export type StartTimeSuggestionsBoxProps = Readonly<{
  label: string;
}> &
  StartTimeSuggestionsProps;

const StartTimeSuggestionsBox = ({
  label,
  ...rest
}: StartTimeSuggestionsBoxProps): JSX.Element => (
  <Box mt={1} flexDirection='row' display='flex' alignItems='center'>
    <Box mr={2}>
      <Typography variant='body2' color='textSecondary'>
        {label}
      </Typography>
    </Box>

    <StartTimeSuggestions {...rest} />
  </Box>
);

export default StartTimeSuggestionsBox;
