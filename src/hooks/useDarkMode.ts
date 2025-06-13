import useMediaQuery from '@mui/material/useMediaQuery';

export const useDarkMode = (): boolean =>
  useMediaQuery('(prefers-color-scheme: dark)');

export default useDarkMode;
