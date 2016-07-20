/**
 * @file React component showing a chat area that may host one or more
 * chat bubbles.
 */

import React, { PropTypes } from 'react'

/**
 * Stateless React component showing a chat area that may host one or
 * more chat bubbles.
 */
export default class ChatArea extends React.Component {
  render () {
    return <div className="chat-area">{ this.props.children }</div>
  }
}

ChatArea.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
}

ChatArea.defaultProps = {
  children: null
}

export default ChatArea
