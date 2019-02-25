/**
 * @file React component showing a marker line in a chat session.
 */

import PropTypes from 'prop-types'
import React from 'react'
import TimeAgo from 'react-time-ago'

/**
 * Mapping from level names to their corresponding CSS classes.
 * @type {Object}
 */
const levelsToClassNames = {
  'error': 'chat-marker chat-marker-error',
  'warning': 'chat-marker chat-marker-warning',
  'info': 'chat-marker chat-marker-info'
}

/**
 * Stateless React component showing a marker line in a chat session.
 */
export default class Marker extends React.Component {
  render () {
    const { level, message, date } = this.props
    const className = levelsToClassNames.hasOwnProperty(level)
      ? levelsToClassNames[level] : levelsToClassNames['info']
    const dateComponent = date
      ? <span className='date'><TimeAgo date={date} /></span>
      : false
    return (
      <div className={className}>
        <span className='message'>{message}</span> {dateComponent}
      </div>
    )
  }
}

Marker.propTypes = {
  level: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Date)
}

Marker.defaultProps = {
  level: 'info',
  message: ''
}
