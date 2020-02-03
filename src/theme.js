/**
 * @file Theme setup for Material-UI.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { blue, lightBlue, orange, red } from '@material-ui/core/colors';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import { ThemeProvider } from '@material-ui/core/styles';

import useDarkMode from '~/hooks/useDarkMode';

const DarkModeAwareThemeProvider = ({ children, type }) => {
  const osHasDarkMode = useDarkMode();
  const isThemeDark = (type === 'auto' && osHasDarkMode) || type === 'dark';
  const theme = createMuiTheme({
    palette: {
      type: isThemeDark ? 'dark' : 'light',
      primary: isThemeDark ? orange : blue,
      secondary: isThemeDark ? lightBlue : red
    }
  });
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

/**
 * Returns whether the given Material UI theme is a dark theme.
 */
export const isDark = theme => theme.palette.type === 'dark';

DarkModeAwareThemeProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  type: PropTypes.oneOf(['auto', 'dark', 'light'])
};

export default connect(
  // mapStateToProps
  state => ({
    type: state.settings.display.theme
  })
)(DarkModeAwareThemeProvider);
