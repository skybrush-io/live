import Box from '@mui/material/Box';
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
  <Box
    sx={{ mt: 1, flexDirection: 'row', display: 'flex', alignItems: 'center' }}
  >
    <Box sx={{ mr: 2 }}>
      <Typography variant='body2' color='textSecondary'>
        {label}
      </Typography>
    </Box>

    <StartTimeSuggestions {...rest} />
  </Box>
);

export default StartTimeSuggestionsBox;
