/**
 * @file Helper functions for the UI testing.
 */

import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import Widget from '../components/Widget'
import theme from '../theme'

/**
 * Given a story factory functions, returns another factory function that
 * wraps the React components returned by the original story factory with
 * a Material UI theme provider component.
 *
 * @param  {function} factory  the original factory function
 * @return {function} the themed factory function
 */
export function themed (factory) {
  return () => (
    React.createElement(MuiThemeProvider, {
      displayName: 'ThemedComponent',
      muiTheme: theme
    }, factory())
  )
}

/**
 * Given a story factory functions, returns another factory function that
 * wraps the React components returned by the original story factory with
 * a Material UI theme provider component and a Widget component.
 *
 * @param  {function} factory  the original factory function
 * @return {function} the themed factory function
 */
export function themedWidget (factory) {
  return () => (
    React.createElement(
      MuiThemeProvider,
      {
        displayName: 'ThemedWidget',
        muiTheme: theme
      },
      React.createElement(Widget,
        {
          style: {
            left: 10,
            top: 10
          }
        }, factory())
    )
  )
}
