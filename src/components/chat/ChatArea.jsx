/**
 * @file React component showing a chat area that may host one or more
 * chat bubbles.
 */

import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'

/**
 * Stateless React component showing a chat area that may host one or
 * more chat bubbles.
 */
export default class ChatArea extends React.Component {
  componentDidUpdate () {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom()
    }
  }

  componentWillUpdate () {
    const node = ReactDOM.findDOMNode(this)
    this.shouldScrollToBottom =
      (node.scrollTop + node.offsetHeight === node.scrollHeight)
  }

  render () {
    const { children, style } = this.props
    return <div className="chat-area" style={style}>{children }</div>
  }

  /**
   * Scrolls the component to the bottom; useful typically after the
   * insertion of a new chat bubble at the bottom.
   */
  scrollToBottom () {
    const node = ReactDOM.findDOMNode(this)
    node.scrollTop = node.scrollHeight
  }
}

ChatArea.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  style: PropTypes.object
}

ChatArea.defaultProps = {
  children: null
}

export default ChatArea
