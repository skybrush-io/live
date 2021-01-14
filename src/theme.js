/**
 * @file Theme setup for Material-UI.
 */

import { useEffect } from 'react';
import { connect } from 'react-redux';

import { blue, lightBlue, orange, blueGrey } from '@material-ui/core/colors';
import { useTheme } from '@material-ui/core/styles';

import {
  createSecondaryAreaStyle,
  createThemeProvider,
  defaultFont,
  isThemeDark as isDark,
  monospacedFont,
} from '@skybrush/app-theme-material-ui';

// eslint-disable-next-line import/no-webpack-loader-syntax
import darkModeExtraCSS from '!!raw-loader!~/../assets/css/dark-mode.css';
import scrollbarCSS from '!!raw-loader!~/../assets/css/scrollbars-win.css';
import scrollbarDarkCSS from '!!raw-loader!~/../assets/css/dark-mode-scrollbars-win.css';

export { createSecondaryAreaStyle, defaultFont, isDark, monospacedFont };

/**
 * Specialized Material-UI theme provider that is aware about the user's
 * preference about whether to use a dark or a light theme.
 */
const DarkModeAwareThemeProvider = createThemeProvider({
  primaryColor: (dark) => (dark ? orange : blue),
  secondaryColor: (dark) => (dark ? lightBlue : blueGrey),
});

const useConditionalCSS = (css, condition) => {
  useEffect(() => {
    if (condition) {
      const style = document.createElement('style');
      const head = document.head || document.querySelectorAll('head')[0];

      style.type = 'text/css';
      style.append(document.createTextNode(css));
      head.append(style);

      return () => style.remove();
    }
  }, [css, condition]);
};

/**
 * Specialized theme provider that dynamically loads a CSS file to update the
 * theme of the workbench to fit dark mode.
 */
export const DarkModeExtraCSSProvider = () => {
  const isThemeDark = isDark(useTheme());
  useConditionalCSS(darkModeExtraCSS, isThemeDark);
  return null;
};

/**
 * Specialized theme provider that dynamically loads a CSS file suitable for
 * styling the scroll bars on non-macOS platforms. (macOS scrollbars look nice
 * without any tweaks).
 */
export const ScrollbarCSSProvider = () => {
  const isMacOs = true;
  const isThemeDark = isDark(useTheme());
  useConditionalCSS(scrollbarDarkCSS, !isMacOs && isThemeDark);
  useConditionalCSS(scrollbarCSS, !isMacOs && !isThemeDark);
  return null;
};

export default connect(
  // mapStateToProps
  (state) => ({
    type: state.settings.display.theme,
  })
)(DarkModeAwareThemeProvider);
