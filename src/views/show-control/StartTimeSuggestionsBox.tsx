import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type React from 'react';

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
}: StartTimeSuggestionsBoxProps): React.JSX.Element => (
  <Stack direction='row' sx={{ mt: 1, alignItems: 'center' }}>
    <Typography variant='body2' color='textSecondary' sx={{ mr: 2 }}>
      {label}
    </Typography>
    <StartTimeSuggestions {...rest} />
  </Stack>
);

export default StartTimeSuggestionsBox;
