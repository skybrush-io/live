/**
 * @file React component showing a chat area that may host one or more
 * chat bubbles.
 */

import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';

/**
 * Stateless React component showing a chat area that may host one or
 * more chat bubbles.
 */
export default class ChatArea extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    style: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this._domNode = React.createRef();
    this._endNode = React.createRef();
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate(_previousProps, _previousState, snapshot) {
    if (snapshot && snapshot.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  getSnapshotBeforeUpdate() {
    const node = this._domNode.current;
    return {
      shouldScrollToBottom:
        node && node.scrollTop + node.clientHeight >= node.scrollHeight - 20,
    };
  }

  render() {
    const { children, ...rest } = this.props;
    return (
      <Box
        ref={this._domNode}
        position='relative'
        overflow='auto'
        flex='1 1 100%'
        {...rest}
      >
        {children}
        <div ref={this._endNode} />
      </Box>
    );
  }

  /**
   * Scrolls the component to the bottom; useful typically after the
   * insertion of a new chat bubble at the bottom.
   */
  scrollToBottom() {
    const node = this._endNode.current;
    if (node) {
      node.scrollIntoView({ behaviour: 'smooth' });
    }
  }
}
