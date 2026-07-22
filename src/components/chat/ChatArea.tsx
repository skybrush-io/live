/**
 * @file React component showing a chat area that may host one or more
 * chat bubbles.
 */

import Box, { type BoxProps } from '@mui/material/Box';
import React from 'react';

type ChatAreaProps = Omit<BoxProps, 'ref'>;

type ChatAreaSnapshot = {
  shouldScrollToBottom: boolean;
};

/**
 * Stateless React component showing a chat area that may host one or
 * more chat bubbles.
 */
export default class ChatArea extends React.Component<
  ChatAreaProps,
  never,
  ChatAreaSnapshot
> {
  private readonly _domNode = React.createRef<HTMLDivElement>();
  private readonly _endNode = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate(
    _previousProps: ChatAreaProps,
    _previousState: never,
    snapshot?: ChatAreaSnapshot
  ) {
    if (snapshot && snapshot.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  getSnapshotBeforeUpdate() {
    const node = this._domNode.current;
    return {
      shouldScrollToBottom:
        node !== null &&
        node.scrollTop + node.clientHeight >= node.scrollHeight - 20,
    };
  }

  render() {
    const { children, sx, ...rest } = this.props;
    return (
      <Box
        ref={this._domNode}
        {...rest}
        sx={{
          position: 'relative',
          overflow: 'auto',
          flex: '1 1 100%',
          ...sx,
        }}
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
      // Apparently a delay is needed with React 19, otherwise the node still has zero
      // height when scrollIntoView() is called and thus it is scrolled into view in a
      // way that only its top edge is visible
      setTimeout(() => void node.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }
}
