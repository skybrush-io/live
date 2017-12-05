/**
 * @file Generic autocomplete text field component that shows the suggestions
 * in a dropdown menu.
 */

import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import { autobind } from 'core-decorators'
import { identity } from 'lodash'
import { MenuItem } from 'material-ui/Menu'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField'
import PropTypes from 'prop-types'
import React from 'react'
import Autosuggest from 'react-autosuggest'

// TODO: "Enter selects first item" feature
/* Helper code:
 *
 *   _onNewRequest (chosenRequest, index) {
 *     if (index === -1 && !this._valueIsAmongUAVIds(chosenRequest)) {
 *       // The user did not choose from the dropdown and the value that the
 *       // user typed does not match any of the items from the data source.
 *       // We can pretend that the user chose the first item from the menu.
 *       const { uavIds } = this.props
 *       const firstMatch = find(uavIds,
 *         uavId => AutoComplete.caseInsensitiveFilter(chosenRequest, uavId))
 *       if (firstMatch) {
 *         chosenRequest = firstMatch
 *       }
 *     }
 *     this._commitValueIfValid(chosenRequest)
 *   }
 */

// TODO: validation feature, error text when invalid

/**
 * Generic autocomplete text field component that shows the suggestions
 * in a dropdown menu.
 */
export class AutoComplete extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      value: '',
      suggestions: []
    }
  }

  @autobind
  _onSuggestionsClearRequested () {
    this.setState({
      suggestions: []
    })
  }

  @autobind
  _onSuggestionsFetchRequested ({ value }) {
    const { fetchSuggestions } = this.props
    this.setState({
      suggestions: fetchSuggestions(value)
    })
  }

  @autobind
  _onValueChanged (event, { newValue }) {
    this.setState({
      value: newValue
    })
  }

  @autobind
  _renderInput (inputProps) {
    return <TextField {...inputProps} />
  }

  @autobind
  _renderSuggestion (suggestion, { query, isHighlighted }) {
    const { getSuggestionLabel, highlight } = this.props
    const label = getSuggestionLabel(suggestion)
    const fragments = highlight
      ? parse(label, match(label, query)).map((part, index) => (
        <span key={index} style={{ fontWeight: part.highlight ? 'bold' : 'normal' }}>
          { part.text }
        </span>
      ))
      : label

    return (
      <MenuItem selected={isHighlighted} component='div'>
        <div>{fragments}</div>
      </MenuItem>
    )
  }

  _renderSuggestionsContainer ({ containerProps, children }) {
    return <Paper {...containerProps} square>{children}</Paper>
  }

  render () {
    const { autoFocus, getSuggestionValue, inputRef, placeholder } = this.props
    const { suggestions, value } = this.state

    return (
      <Autosuggest
        getSuggestionValue={getSuggestionValue}
        inputProps={{
          autoFocus,
          inputRef,
          placeholder,
          value,
          onChange: this._onValueChanged
        }}
        onSuggestionsFetchRequested={this._onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this._onSuggestionsClearRequested}
        renderInputComponent={this._renderInput}
        renderSuggestion={this._renderSuggestion}
        renderSuggestionsContainer={this._renderSuggestionsContainer}
        suggestions={suggestions}
      />
    )
  }
}

AutoComplete.propTypes = {
  autoFocus: PropTypes.bool,
  fetchSuggestions: PropTypes.func,
  getSuggestionLabel: PropTypes.func.isRequired,
  getSuggestionValue: PropTypes.func.isRequired,
  inputRef: PropTypes.func,
  highlight: PropTypes.bool,
  placeholder: PropTypes.string
}

AutoComplete.defaultProps = {
  getSuggestionLabel: identity,
  getSuggestionValue: identity,
  highlight: true
}
