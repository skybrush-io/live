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
    const { leftComponent, rightComponent } = this.props
    const dateComponent = date
      ? <span className={'date'}><TimeAgo date={date} /></span>
      : false
    const leftComponentWrapper = leftComponent
      ? <div style={{ flex: 0 }}>{leftComponent}</div>
      : false
    const rightComponentWrapper = rightComponent
      ? <div style={{ flex: 0 }}>{rightComponent}</div>
      : false
    return (
      <div className={'chat-entry chat-entry-' + (own ? 'own' : 'other')}>
        {leftComponentWrapper}
        <div style={{ flex: 1 }}>
          <div className={'chat-meta'}>
            <span className={'author'}>{author}</span> {dateComponent}
          </div>
          <div className={'bubble'}>
            {body}
          </div>
        </div>
        {rightComponentWrapper}
      </div>
    )
  }
}

ChatBubble.propTypes = {
  author: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date),
  own: PropTypes.bool.isRequired,
  leftComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  rightComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

ChatBubble.defaultProps = {
  author: 'Anonymous',
  body: '',
  own: true
}
