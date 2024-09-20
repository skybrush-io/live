import useMediaQuery from '@material-ui/core/useMediaQuery';

export const useDarkMode = (): boolean =>
  useMediaQuery('(prefers-color-scheme: dark)');

export default useDarkMode;
