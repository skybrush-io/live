import { green500 } from 'material-ui/colors'
import ConnectionIcon from 'material-ui-icons/Power'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { Badge } from './Badge'

import { showServerSettingsDialog } from '../actions/server-settings'

const ConnectionSettingsButtonPresentation = ({ isConnected, onClick }) => {
  const classes = ['wb-module']
  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className='wb-icon wb-module-icon'>
        <Badge visible />
        <ConnectionIcon onClick={onClick} />
      </span>
      Connection
    </div>
  )
}

ConnectionSettingsButtonPresentation.propTypes = {
  isConnected: PropTypes.bool,
  onClick: PropTypes.func
}

export default connect(
  // mapStateToProps
  state => ({
    isConnected: true
  }),
  // mapDispatchToProps
  dispatch => ({
    onClick () {
      dispatch(showServerSettingsDialog())
    }
  })
)(ConnectionSettingsButtonPresentation)
