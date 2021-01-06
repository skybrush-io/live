/**
 * @file Theme setup for Material-UI.
 */

import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { blue, lightBlue, orange, blueGrey } from '@material-ui/core/colors';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import { ThemeProvider, useTheme } from '@material-ui/core/styles';

import {
  createThemeProvider,
  defaultFont,
  isThemeDark as isDark,
  monospacedFont
} from '@skybrush/app-theme-material-ui';

import Colors from '~/components/colors';
import useDarkMode from '~/hooks/useDarkMode';

// eslint-disable-next-line import/no-webpack-loader-syntax
import darkModeExtraCSS from '!!raw-loader!~/../assets/css/dark-mode.css';

export { defaultFont, isDark, monospacedFont };

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
const DarkModeAwareThemeProvider = createThemeProvider({
  primaryColor: (dark) => dark ? orange : blue,
  secondaryColor: (dark) => dark ? lightBlue : blueGrey
});

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
