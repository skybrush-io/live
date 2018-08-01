/**
 * @file Theme setup for Material-UI.
 */

import blue from '@material-ui/core/colors/blue'
import common from '@material-ui/core/colors/common'
import createMuiTheme from '@material-ui/core/styles/createMuiTheme'

export default createMuiTheme({
  palette: {
    action: {
      active: common.darkBlack
    },
    primary: blue
  }
})
