import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';

type Props = {
  children: React.ReactNode;
};

const Centered = ({ children }: Props) => {
  return (
    <Box
      sx={(theme: Theme) => ({
        padding: theme.spacing(2),
        textAlign: 'center',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      })}
    >
      {children}
    </Box>
  );
};

export default Centered;
