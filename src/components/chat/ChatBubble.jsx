/**
 * @file React component showing a single chat bubble in a chat session.
 */

import PropTypes from 'prop-types';
import React from 'react';
import TimeAgo from 'react-time-ago';

/**
 * Stateless React component showing a single chat bubble in a chat
 * session.
 */
export default class ChatBubble extends React.Component {
  render() {
    const { author, body, date, own, raw } = this.props;
    const { leftComponent, rightComponent } = this.props;
    const dateComponent = date ? (
      <span className="date">
        <TimeAgo date={date} />
      </span>
    ) : (
      false
    );
    const leftComponentWrapper = leftComponent ? (
      <div style={{ flex: 0 }}>{leftComponent}</div>
    ) : (
      false
    );
    const rightComponentWrapper = rightComponent ? (
      <div style={{ flex: 0 }}>{rightComponent}</div>
    ) : (
      false
    );
    const bubble = raw ? (
      <div className="bubble" dangerouslySetInnerHTML={{ __html: body }} />
    ) : (
      <div className="bubble">{body}</div>
    );
    return (
      <div className={'chat-entry chat-entry-' + (own ? 'own' : 'other')}>
        {leftComponentWrapper}
        <div style={{ flex: 1, maxWidth: '100%' }}>
          <div className="chat-meta">
            <span className="author">{author}</span> {dateComponent}
          </div>
          {bubble}
        </div>
        {rightComponentWrapper}
      </div>
    );
  }
}

ChatBubble.propTypes = {
  author: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date),
  own: PropTypes.bool.isRequired,
  raw: PropTypes.bool,
  leftComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  rightComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
};

ChatBubble.defaultProps = {
  author: 'Anonymous',
  body: '',
  own: true,
  raw: false
};
