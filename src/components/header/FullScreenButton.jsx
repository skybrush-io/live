import NavigationFullscreen from '@material-ui/icons/Fullscreen'
import NavigationFullscreenExit from '@material-ui/icons/FullscreenExit'

import PropTypes from 'prop-types'
import React, { useCallback } from 'react'
import { useEvent, useUpdate } from 'react-use'
import ScreenFull from 'screenfull'

const FullScreenButtonPresentation = ({ enabled, isFullscreen, onClick, showLabel }) => {
  const classes = ['wb-module']
  if (!enabled) {
    classes.push('wb-module-disabled')
  }
  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className='wb-icon wb-module-icon'>
        {isFullscreen ? <NavigationFullscreenExit /> : <NavigationFullscreen />}
      </span>
      {showLabel ? (
        <span className='wb-label wb-module-label'>
          {isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        </span>
      ) : null}
    </div>
  )
}

FullScreenButtonPresentation.propTypes = {
  enabled: PropTypes.bool.isRequired,
  isFullscreen: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool
}

const FullScreenButton = () => {
  const toggleFullscreen = useCallback(() => ScreenFull.toggle(), [])
  const update = useUpdate()

  useEvent('change', update, ScreenFull)
  useEvent('error', update, ScreenFull)

  return (
    <FullScreenButtonPresentation isFullscreen={ScreenFull.isFullscreen}
      enabled={ScreenFull.isEnabled} onClick={toggleFullscreen} />
  )
}

export default FullScreenButton
