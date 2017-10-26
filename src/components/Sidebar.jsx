import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import Shapeshifter from 'react-shapeshifter'

import { toggleSidebar } from '../actions/sidebar'

const style = {
  backgroundColor: '#333',
  boxShadow: 'inset -3px 0 6px rgba(0, 0, 0, 0.5)',
  height: '100%'
}

/**
 * Presentation component for the sidebar at the left edge of the main
 * window.
 *
 * @returns  {Object}  the rendered sidebar component
 */
const SidebarPresentation = ({ open, onToggleSidebar }) => (
  <div style={{ ...style, width: open ? 240 : 48 }}>
    <Shapeshifter color="#999" shape={ open ? 'close' : 'menu' } onClick={onToggleSidebar} />
  </div>
)

SidebarPresentation.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
}

/**
 * Sidebar at the left edge of the main window.
 */
const Sidebar = connect(
  // mapStateToProps
  state => state.sidebar,
  // mapDispatchToProps
  dispatch => ({
    onToggleSidebar () {
      dispatch(toggleSidebar())
    }
  })
)(SidebarPresentation)

export default Sidebar
