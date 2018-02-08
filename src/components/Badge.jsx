import * as PropTypes from 'prop-types'
import * as React from 'react'

import Transition from 'react-transition-group/Transition'

export const Badge = ({ color, offset, visible }) => {
  const baseStyles = {}

  if (color) {
    baseStyles.background = color
  }

  if (offset) {
    baseStyles.top = offset[1]
    baseStyles.right = offset[0]
  }

  return (
    <Transition appear timeout={300} in={visible}>
      {
        state => (
          <div className='wb-modification-indicator' style={{
            ...baseStyles,
            transform: (state === 'entering' || state === 'entered') ? 'scale(1)' : 'scale(0)',
            transition: 'transform 300ms ease-in-out, background-color 300ms linear'
          }} />
        )
      }
    </Transition>
  )
}

Badge.propTypes = {
  color: PropTypes.string,
  offset: PropTypes.arrayOf(PropTypes.number),
  visible: PropTypes.bool
}
