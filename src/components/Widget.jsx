/**
 * @file Generic component that represents a widget floating on top of the
 * map view in the main window.
 *
 * In a future version, the user will probably be given the option to move
 * widgets around or close them.
 */

import React, { PropTypes } from 'react'

import IconButton from 'material-ui/IconButton'
import Paper from 'material-ui/Paper'
import ContentClear from 'material-ui/svg-icons/content/clear'

const Widget = ({ children, style }) => (
  <Paper className="widget" style={style}>
    <div className="widget-action-bar">
      <IconButton><ContentClear/></IconButton>
    </div>
    { children }
  </Paper>
)

Widget.propTypes = {
  children: PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node
  ]),
  style: PropTypes.object
}

Widget.defaultProps = {
  children: null,
  style: {}
}

export default Widget
