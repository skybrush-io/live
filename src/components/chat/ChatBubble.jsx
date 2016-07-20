/**
 * @file React component showing a single chat bubble in a chat session.
 */

import React, { PropTypes } from 'react'
import TimeAgo from 'react-timeago'

/**
 * Stateless React component showing a single chat bubble in a chat
 * session.
 */
export default class ChatBubble extends React.Component {
  render () {
    const { author, body, date, own } = this.props
    const dateComponent = date
      ? <span className="date"><TimeAgo date={date} /></span>
      : false
    return (
      <div className={'chat-entry chat-entry-' + (own ? 'own' : 'other')}>
        <div className="chat-meta">
          <span className="author">{author}</span> {dateComponent}
        </div>
        <div className="bubble">
          {body}
        </div>
      </div>
    )
  }
}

ChatBubble.propTypes = {
  author: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date),
  own: PropTypes.bool.isRequired
}

ChatBubble.defaultProps = {
  author: 'Anonymous',
  body: '',
  own: true
}

export default ChatBubble
