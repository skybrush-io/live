import type { StackProps } from '@mui/material/Stack';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
  title?: string;
} & StackProps;

/**
 * A stacked container that is suitable to hold a list of progress cards.
 */
const ProgressCardContainer = ({ children, title, sx, ...rest }: Props) => (
  <Stack spacing={2} sx={{ p: 2, ...sx }} {...rest}>
    {title ? (
      <Typography variant='button' color='textSecondary'>
        {title}
      </Typography>
    ) : null}
    {children}
  </Stack>
);

export default ProgressCardContainer;
