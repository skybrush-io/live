import * as PropTypes from 'prop-types'
import * as React from 'react'

import Transition from 'react-transition-group/Transition'

const renderBadge = state => (
  <div className='wb-modification-indicator' style={{
    transform: (state === 'entering' || state === 'entered') ? 'scale(1)' : 'scale(0)',
    transition: 'transform 300ms ease-in-out'
  }} />
)

export const Badge = ({ color, visible }) => (
  <Transition timeout={300} in={visible}>{renderBadge}</Transition>
)

Badge.propTypes = {
  color: PropTypes.string,
  visible: PropTypes.bool
}
