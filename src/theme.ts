/**
 * @file Theme setup for Material-UI.
 */

import { blue, blueGrey, lightBlue, orange } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import { connect } from 'react-redux';

import {
  createThemeProvider,
  isThemeDark,
  useConditionalCSS,
} from '@skybrush/app-theme-mui';

import type { RootState } from './store/reducers';

// @ts-expect-error TS(2307)
import darkModeExtraCSS from '!!raw-loader!~/../assets/css/dark-mode.css';

/**
 * Specialized Material-UI theme provider that is aware about the user's
 * preference about whether to use a dark or a light theme.
 */
const DarkModeAwareThemeProvider = createThemeProvider({
  primaryColor: (dark) => (dark ? orange : blue),
  secondaryColor: (dark) => (dark ? lightBlue : blueGrey),
});

/**
 * Specialized theme provider that dynamically loads a CSS file to update the
 * theme of the workbench to fit dark mode.
 */
export const DarkModeExtraCSSProvider = () => {
  const isDark = isThemeDark(useTheme());
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  useConditionalCSS(darkModeExtraCSS, isDark);
  return null;
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    type: state.settings.display.theme,
  })
)(DarkModeAwareThemeProvider);
