/**
 * @file Generic autocomplete text field component that shows the suggestions
 * in a dropdown menu.
 */

import match from 'autosuggest-highlight/match'
import parse from 'autosuggest-highlight/parse'
import { autobind } from 'core-decorators'
import { identity, toLower } from 'lodash'
import { MenuItem, MenuList } from 'material-ui/Menu'
import Popover from 'material-ui/Popover'
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

    this._inputRef = undefined

    this.state = {
      input: null,
      suggestions: [],
      value: ''
    }
  }

  @autobind
  _assignInputRef (value) {
    if (this._inputRef !== undefined) {
      this._inputRef(value)
    }
    if (this.props.inputRef !== undefined) {
      this.props.inputRef(value)
    }
    this.setState({ input: value })
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
      suggestions: fetchSuggestions ? fetchSuggestions(value) : []
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
    const { ref, ...restInputProps } = inputProps
    this._inputRef = ref
    return <TextField inputRef={this._assignInputRef} {...restInputProps} />
  }

  @autobind
  _renderSuggestion (suggestion, { query, isHighlighted }) {
    const { getSuggestionLabel, highlightMatches } = this.props
    const label = getSuggestionLabel(suggestion)
    const fragments = highlightMatches
      ? parse(label, match(label, query)).map((part, index) => (
        <span key={index} style={{ backgroundColor: part.highlight ? 'yellow' : 'inherit' }}>
          { part.text }
        </span>
      ))
      : label

    return (
      <MenuItem selected={isHighlighted} component='div'>
        {fragments}
      </MenuItem>
    )
  }

  @autobind
  _renderSuggestionsContainer ({ containerProps, children }) {
    const numChildren = React.Children.count(children)
    return (
      <Popover anchorEl={this.state.input} open={numChildren > 0}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableAutoFocus
        {...containerProps}>
        <MenuList>
          {children}
        </MenuList>
      </Popover>
    )
  }

  render () {
    const { autoFocus, getSuggestionValue, highlightFirstSuggestion,
      label, placeholder, style } = this.props
    const { suggestions, value } = this.state

    return (
      <Autosuggest
        getSuggestionValue={getSuggestionValue}
        highlightFirstSuggestion={highlightFirstSuggestion}
        inputProps={{
          autoFocus,
          label,
          placeholder,
          style,
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

  /**
   * Creates a fetcher function that expects a value type into the
   * autocomplete field and returns those items from ``values`` where the
   * typed value is a prefix of the actual value.
   *
   * @param  {string[]}  values  the array of possible items that the
   *         fetcher will match
   * @param  {Object}  options  options that influence how the fetcher
   *         behaves
   * @param  {number}  options.maxItems  the maximum number of suggestions
   *         to return for a single input
   * @param  {boolean} options.caseSensitive  whether matching should be
   *         case sensitive
   * @return {function} a function that will map values typed into the
   *         autocomplete field to the corresponding suggestions
   */
  static makePrefixBasedFetcher (values, options = {}) {
    const effectiveOptions = {
      caseSensitive: true,
      maxItems: 5,
      ...options
    }
    const valuesToMatch = effectiveOptions.caseSensitive
      ? values
      : values.map(toLower)

    return (value) => {
      const result = []
      const { maxItems } = effectiveOptions

      if (value && value.length > 0 && maxItems > 0) {
        if (!effectiveOptions.caseSensitive) {
          value = toLower(value)
        }

        valuesToMatch.forEach((item, index) => {
          if (item.startsWith(value)) {
            result.push(values[index])
            if (result.length >= maxItems) {
              return false
            }
          }
        })
      }

      return result
    }
  }
}

AutoComplete.propTypes = {
  autoFocus: PropTypes.bool,
  fetchSuggestions: PropTypes.func,
  getSuggestionLabel: PropTypes.func.isRequired,
  getSuggestionValue: PropTypes.func.isRequired,
  highlightFirstSuggestion: PropTypes.bool,
  highlightMatches: PropTypes.bool,
  label: PropTypes.node,
  inputRef: PropTypes.func,
  placeholder: PropTypes.string,
  style: PropTypes.object
}

AutoComplete.defaultProps = {
  getSuggestionLabel: identity,
  getSuggestionValue: identity,
  highlightFirstSuggestion: true,
  highlightMatches: true
}
