/**
 * @file React component showing a chat area that may host one or more
 * chat bubbles.
 */

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

/**
 * Stateless React component showing a chat area that may host one or
 * more chat bubbles.
 */
export default class ChatArea extends React.Component {
  constructor (props) {
    super(props)

    this._domNode = null

    this._setDOMNode = node => {
      this._domNode = node
    }
  }

  componentDidUpdate () {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom()
    }
  }

  componentWillUpdate () {
    const node = this._domNode
    this.shouldScrollToBottom = node &&
      (node.scrollTop + node.clientHeight >= node.scrollHeight - 5)
  }

  render () {
    window.ReactDOM = ReactDOM
    const { children, style } = this.props
    return (
      <div className="chat-area" ref={this._setDOMNode}
        style={style}>{children}</div>
    )
  }

  /**
   * Scrolls the component to the bottom; useful typically after the
   * insertion of a new chat bubble at the bottom.
   */
  scrollToBottom () {
    if (this._domNode) {
      this._domNode.scrollTop = this._domNode.scrollHeight
    }
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
