import Box from '@mui/material/Box';
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

type ListItemTextWithProgressProps = Omit<
  ListItemTextProps,
  'disableTypography'
> & {
  primary: ReactNode;
  secondary: ReactNode;
};

/**
 * Variant on the Material-UI list item component that is styled in a way that
 * we can place a `<LinearProgress />` component in the secondary text without
 * messing up the layout.
 */
const ListItemTextWithProgress = ({
  secondary,
  ...rest
}: ListItemTextWithProgressProps) => (
  <ListItemText
    {...rest}
    disableTypography
    secondary={
      <Box
        sx={{
          minHeight: 20.1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography component='div' variant='body2' color='textSecondary'>
          {secondary}
        </Typography>
      </Box>
    }
  />
);

export default ListItemTextWithProgress;
