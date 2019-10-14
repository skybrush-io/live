/**
 * @file React component showing a chat area that may host one or more
 * chat bubbles.
 */

import PropTypes from 'prop-types';
import React from 'react';

/**
 * Stateless React component showing a chat area that may host one or
 * more chat bubbles.
 */
export default class ChatArea extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]),
    style: PropTypes.object
  };

  constructor(props) {
    super(props);
    this._domNode = React.createRef();
  }

  componentDidUpdate(_prevProps, _prevState, snapshot) {
    if (snapshot && snapshot.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  getSnapshotBeforeUpdate() {
    const node = this._domNode.current;
    return {
      shouldScrollToBottom:
        node && node.scrollTop + node.clientHeight >= node.scrollHeight - 5
    };
  }

  render() {
    const { children, style } = this.props;
    return (
      <div ref={this._domNode} className="chat-area" style={style}>
        {children}
      </div>
    );
  }

  /**
   * Scrolls the component to the bottom; useful typically after the
   * insertion of a new chat bubble at the bottom.
   */
  scrollToBottom() {
    const node = this._domNode.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }
}
