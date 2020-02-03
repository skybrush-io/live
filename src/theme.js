/**
 * @file Theme setup for Material-UI.
 */

import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { blue, lightBlue, orange, red } from '@material-ui/core/colors';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import { ThemeProvider, useTheme } from '@material-ui/core/styles';

import useDarkMode from '~/hooks/useDarkMode';

// eslint-disable-next-line import/no-webpack-loader-syntax, import/extensions
import darkModeExtraCSS from '!!raw-loader!~/../assets/css/dark-mode.css';

/**
 * Helper function that returns whether the given Material UI theme is a dark theme.
 */
export const isDark = theme => theme.palette.type === 'dark';

/**
 * Specialized Material-UI theme provider that is aware about the user's
 * preference about whether to use a dark or a light theme.
 */
const DarkModeAwareThemeProvider = ({ children, type }) => {
  const osHasDarkMode = useDarkMode();
  const isThemeDark = (type === 'auto' && osHasDarkMode) || type === 'dark';

  // Create the Material-UI theme that we are going to use
  const theme = createMuiTheme({
    palette: {
      type: isThemeDark ? 'dark' : 'light',
      primary: isThemeDark ? orange : blue,
      secondary: isThemeDark ? lightBlue : red
    }
  });

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

DarkModeAwareThemeProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  type: PropTypes.oneOf(['auto', 'dark', 'light'])
};

/**
 * Specialized theme provider that dynamically loads a CSS file to update the
 * theme of the workbench to fit dark mode.
 */
export const DarkModeExtraCSSProvider = () => {
  const theme = useTheme();
  const isThemeDark = isDark(theme);

  useEffect(() => {
    if (isThemeDark) {
      const style = document.createElement('style');
      const head = document.head || document.querySelectorAll('head')[0];

      style.type = 'text/css';
      style.append(document.createTextNode(darkModeExtraCSS));
      head.append(style);

      return () => head.removeChild(style);
    }
  }, [isThemeDark]);

  return null;
};

export default connect(
  // mapStateToProps
  state => ({
    type: state.settings.display.theme
  })
)(DarkModeAwareThemeProvider);
