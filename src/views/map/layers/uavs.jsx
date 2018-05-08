import { layer } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'

import ActiveUAVsLayerSource from '../sources/ActiveUAVsLayerSource'

import { setLayerParameterById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'
import flock from '../../../flock'
import { getSelection } from '../../../selectors'
import { coordinateFromLonLat } from '../../../utils/geography'
import makeLogger from '../../../utils/logging'

const colors = [ 'blue', 'green', 'orange', 'pink', 'purple', 'yellow' ]

const logger = makeLogger('UAVsLayer')

const validatePredicates = (predicates, errorHandler) => {
  const validPredicates = {}
  const invalidPredicates = []

  for (const color in predicates) {
    try {
      /* eslint no-new-func: "off", no-unused-vars: "off" */
      const predicateFunction = new Function('id', `return ${predicates[color]}`)
      // Testing the function for errors with a sample string parameter.
      const testResult = predicateFunction('TEST-01')
      // If it didn't produce any errors then it is stored.
      validPredicates[color] = predicates[color]
    } catch (e) {
      invalidPredicates.push(color)
      errorHandler(`Invalid color predicate for ${color}: "${e}"`)
    }
  }

  return { validPredicates, invalidPredicates }
}

// === Settings for this particular layer type ===

class UAVsLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      colorPredicates: props.layer.parameters.colorPredicates,
      invalidPredicates: []
    }

    this._makeChangeHandler = this._makeChangeHandler.bind(this)
    this._handleKeyPress = this._handleKeyPress.bind(this)
    this._handleClick = this._handleClick.bind(this)
  }

  render () {
    const colorInputs = colors.map(color => (
      <TextField
        fullWidth
        key={`${color}_predicate_textfield`}
        name={`${color}_predicate_textfield`}
        label={color}
        value={this.state.colorPredicates[color] || ''}
        error={this.state.invalidPredicates.includes(color)}
        onChange={this._makeChangeHandler(color)}
        onKeyPress={this._handleKeyPress}
      />
    ))
    return (
      <div>
        <p key="header">
          Color predicates (e.g. <code>id.includes(&apos;1&apos;)</code>)
        </p>
        {colorInputs}
        <p style={{ textAlign: 'center' }}>
          <Button onClick={this._handleClick}>Apply changes</Button>
        </p>
      </div>
    )
  }

  _makeChangeHandler (color) {
    return (event) => {
      const colorPredicates = {
        ...this.state.colorPredicates,
        [color]: event.target.value
      }
      this.setState({ colorPredicates })
    }
  }

  _handleKeyPress (e) {
    if (e.key === 'Enter') {
      this._handleClick()
    }
  }

  _handleClick () {
    const { validPredicates, invalidPredicates } = (
      validatePredicates(this.state.colorPredicates, logger.error)
    )

    this.props.setLayerParameter(
      'colorPredicates',
      { ...this.props.layer.parameters.colorPredicates, ...validPredicates }
    )

    this.setState({ invalidPredicates })
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
    const { projection, selection, zIndex } = this.props
    return (
      <layer.Vector updateWhileAnimating updateWhileInteracting
        zIndex={zIndex}>
        <ActiveUAVsLayerSource
          selection={selection}
          colorPredicates={this.props.layer.parameters.colorPredicates}
          flock={flock}
          projection={projection}
        />
      </layer.Vector>
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

export const UAVsLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    selection: getSelection(state)
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UAVsLayerPresentation)
