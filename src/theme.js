/**
 * @file Theme setup for Material-UI.
 */

import blue from '@material-ui/core/colors/blue'
import createMuiTheme from '@material-ui/core/styles/createMuiTheme'
import red from '@material-ui/core/colors/red'

export default createMuiTheme({
  palette: {
    primary: blue,
    secondary: red
  }
})
