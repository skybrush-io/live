/**
 * @file Theme setup for Material-UI.
 */

import { connect } from 'react-redux';

import { blue, lightBlue, orange, blueGrey } from '@material-ui/core/colors';
import { useTheme } from '@material-ui/core/styles';

import {
  createThemeProvider,
  isThemeDark,
  useConditionalCSS,
} from '@skybrush/app-theme-material-ui';

// eslint-disable-next-line import/no-webpack-loader-syntax
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
  useConditionalCSS(darkModeExtraCSS, isDark);
  return null;
};

export default connect(
  // mapStateToProps
  (state) => ({
    type: state.settings.display.theme,
  })
)(DarkModeAwareThemeProvider);
