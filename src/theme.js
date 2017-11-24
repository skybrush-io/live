/**
 * @file Theme setup for Material-UI.
 */

import blue from 'material-ui/colors/blue'
import common from 'material-ui/colors/common'
import createMuiTheme from 'material-ui/styles/createMuiTheme'

export default createMuiTheme({
  palette: {
    action: {
      active: common.darkBlack
    },
    primary: blue
  }
})
