import { layer } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import u from 'updeep'

import ActiveUAVsLayerSource from '../ActiveUAVsLayerSource'
import flock from '../../../flock'

import { colorPredicates } from '../features/UAVFeature'

import RaisedButton from 'material-ui/RaisedButton'
import ActionSystemUpdateAlt from 'material-ui/svg-icons/action/system-update-alt'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'
import * as logging from '../../../utils/logging'
import { showSnackbarMessage } from '../../../actions/snackbar'

import { getSelectedFeatureIds } from '../../../selectors'
import { updateUAVFeatureColorsSignal } from '../../../signals'
import { coordinateFromLonLat } from '../../../utils/geography'

const colors = ['pink', 'orange', 'yellow', 'green', 'blue', 'purple']

const updatePredicates = (predicates, errorHandler) => {
  for (const color in predicates) {
    try {
      /* eslint no-new-func: "off" */
      colorPredicates[color] = new Function('id', `return ${predicates[color]}`)
    } catch (e) {
      errorHandler(`Invalid color predicate for ${color} --> ${e}`)
    }
  }
}

// === Settings for this particular layer type ===

class UAVsLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      colorPredicates: props.layer.parameters.colorPredicates
    }

    this._makeChangeHandler = this._makeChangeHandler.bind(this)
    this._handleClick = this._handleClick.bind(this)
  }

  render () {
    const colorInputs = colors.map(color => (
      <TextField
        style={{ marginTop: '-20px', fontFamily: 'monospace' }}
        key={`${color}_predicate_textfield`}
        name={`${color}_predicate_textfield`}
        floatingLabelText={color}
        value={this.state.colorPredicates[color]}
        onChange={this._makeChangeHandler(color)} />
    ))
    return (
      <div>
        <p key="header">
          Color predicates (e.g. <code>id.includes(&apos;1&apos;)</code>)
        </p>
        {colorInputs}
        <br />
        <RaisedButton
          label={'Apply'}
          icon={<ActionSystemUpdateAlt />}
          onClick={this._handleClick} />
      </div>
    )
  }

  componentWillReceiveProps (newProps) {
    updatePredicates(
      newProps.layer.parameters.colorPredicates,
      this.props.showMessage
    )
    updateUAVFeatureColorsSignal.dispatch()
  }

  _makeChangeHandler (color) {
    return (event) => {
      this.setState(
        u.updateIn(`colorPredicates.${color}`, event.target.value, this.state)
      )
    }
  }

  _handleClick () {
    this.props.setLayerParameter('colorPredicates', this.state.colorPredicates)
  }
}

UAVsLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameter: PropTypes.func,
  showMessage: PropTypes.func
}

export const UAVsLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    },
    showMessage: (message) => {
      dispatch(showSnackbarMessage(message))
    }
  })
)(UAVsLayerSettingsPresentation)

// === The actual layer to be rendered ===

class UAVsLayerPresentation extends React.Component {
  render () {
    return (
      <div>
        <layer.Vector ref={this.context._assignActiveUAVsLayerRef}
          updateWhileAnimating
          updateWhileInteracting
          zIndex={this.props.zIndex}>

          <ActiveUAVsLayerSource ref={this.context._assignActiveUAVsLayerSourceRef}
            selection={this.props.selection}
            flock={flock}
            projection={this.props.projection} />

        </layer.Vector>
      </div>
    )
  }

  componentWillReceiveProps (newProps) {
    updatePredicates(
      newProps.layer.parameters.colorPredicates,
      logging.addErrorItem
    )
  }
}

UAVsLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number,

  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  projection: PropTypes.func.isRequired
}

UAVsLayerPresentation.defaultProps = {
  projection: coordinateFromLonLat
}

UAVsLayerPresentation.contextTypes = {
  _assignActiveUAVsLayerRef: PropTypes.func,
  _assignActiveUAVsLayerSourceRef: PropTypes.func
}

export const UAVsLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    selection: getSelectedFeatureIds(state)
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UAVsLayerPresentation)
