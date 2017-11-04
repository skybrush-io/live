import { NavigationFullscreen, NavigationFullscreenExit } from 'material-ui/svg-icons'

import PropTypes from 'prop-types'
import React from 'react'
import ScreenFull from 'screenfull'

const FullScreenButtonPresentation = ({ enabled, isFullscreen, onClick }) => {
  const classes = ['wb-module']
  if (!enabled) {
    classes.push('wb-module-disabled')
  }
  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className="wb-icon wb-module-icon">
        {isFullscreen ? <NavigationFullscreenExit color="white" /> : <NavigationFullscreen color="white" />}
      </span>
      {isFullscreen ? 'Exit full screen' : 'Enter full screen'}
    </div>
  )
}

FullScreenButtonPresentation.propTypes = {
  enabled: PropTypes.bool.isRequired,
  isFullscreen: PropTypes.bool.isRequired,
  onClick: PropTypes.func
}

export default class FullScreenButton extends React.Component {
  constructor (props) {
    super(props)

    this._onFullScreenStateChanged = this._onFullScreenStateChanged.bind(this)
  }

  componentWillMount () {
    ScreenFull.on('change', this._onFullScreenStateChanged)
    ScreenFull.on('error', this._onFullScreenStateChanged)
  }

  componentWillUnmount () {
    ScreenFull.off('change', this._onFullScreenStateChanged)
    ScreenFull.off('error', this._onFullScreenStateChanged)
  }

  render () {
    return (
      <FullScreenButtonPresentation isFullscreen={ScreenFull.isFullscreen}
        enabled={ScreenFull.enabled} onClick={this._toggleFullScreen} />
    )
  }

  _onFullScreenStateChanged () {
    this.forceUpdate()
  }

  _toggleFullScreen () {
    ScreenFull.toggle()
  }
}
