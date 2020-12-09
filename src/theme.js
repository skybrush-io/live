/**
 * @file Theme setup for Material-UI.
 */

import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { blue, lightBlue, orange, blueGrey } from '@material-ui/core/colors';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import { ThemeProvider, useTheme } from '@material-ui/core/styles';

import Colors from '~/components/colors';
import useDarkMode from '~/hooks/useDarkMode';

// eslint-disable-next-line import/no-webpack-loader-syntax
import darkModeExtraCSS from '!!raw-loader!~/../assets/css/dark-mode.css';

/**
 * Helper function that returns whether the given Material UI theme is a dark theme.
 */
export const isDark = (theme) => theme.palette.type === 'dark';

export const defaultFont = '"Fira Sans", "Helvetica", "Arial", sans-serif';

export const monospacedFont =
  '"Proggy Vector", "Menlo", "Consolas", "DejaVu Sans Mono", "Courier New", "Courier", monospace';

export const createSecondaryAreaStyle = (theme, { inset } = {}) => {
  const dark = isDark(theme);

  const style = {
    background: dark
      ? 'linear-gradient(160deg, #2c2c2c 0%, #1f1f1f 100%)'
      : '#fafafa',
  };

  switch (inset) {
    case 'top':
      Object.assign(style, {
        borderTop: `1px solid ${
          dark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
        }`,
        boxShadow: '0 2px 6px -2px inset rgba(0, 0, 0, 0.54)',
      });
      break;

    case 'bottom':
      Object.assign(style, {
        borderBottom: `1px solid ${
          dark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
        }`,
        boxShadow: '0 -2px 6px -2px inset rgba(0, 0, 0, 0.54)',
      });
      break;

    case 'left':
      Object.assign(style, {
        borderLeft: `1px solid ${
          dark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
        }`,
        boxShadow: '2px 0 6px -2px inset rgba(0, 0, 0, 0.54)',
      });
      break;

    case 'right':
      Object.assign(style, {
        borderRight: `1px solid ${
          dark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
        }`,
        boxShadow: '-2px 0 6px -2px inset rgba(0, 0, 0, 0.54)',
      });
      break;

    default:
      Object.assign(style, {
        border: `1px solid ${
          dark ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
        }`,
        boxShadow: '0 0 6px -2px inset rgba(0, 0, 0, 0.54)',
      });
  }

  return style;
};

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
      secondary: isThemeDark ? lightBlue : blueGrey,

      success: {
        main: Colors.success,
      },
    },

    typography: {
      fontFamily: defaultFont,
    },

    overrides: {
      MuiList: {
        root: {
          background: isThemeDark ? '#424242' : '#fff',
        },
      },

      MuiTab: {
        root: {
          minWidth: 80,
        },
      },
    },

    // Customize z indices to ensure that react-toast-notifications appear
    // above Material-UI stuff. (react-toast-notifications has a Z index of
    // 1000 and it is hard to customize)
    zIndex: {
      mobileStepper: 600,
      speedDial: 650,
      appBar: 700,
      drawer: 800,
      modal: 900,
      snackbar: 1000,
      tooltip: 1100,
    },
  });

  /* Request from Ubi and Soma: selection should have more contrast; 0.08 is
   * the default */
  theme.palette.action.selected = isThemeDark
    ? 'rgba(255, 255, 255, 0.16)'
    : 'rgba(0, 0, 0, 0.16)';
  theme.palette.action.selectedOpacity = 0.16;

  /* This is needed to make sure that the tab width we prescribed is not
   * overwritten by more specific media queries */
  theme.overrides.MuiTab.root[theme.breakpoints.up('xs')] = {
    minWidth: theme.overrides.MuiTab.root.minWidth,
  };

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

DarkModeAwareThemeProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  type: PropTypes.oneOf(['auto', 'dark', 'light']),
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

      return () => style.remove();
    }
  }, [isThemeDark]);

  return null;
};

export default connect(
  // mapStateToProps
  (state) => ({
    type: state.settings.display.theme,
  })
)(DarkModeAwareThemeProvider);
