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

/**
 * Generic autocomplete text field component that shows the suggestions
 * in a dropdown menu.
 */
export class AutoComplete extends React.Component {
  constructor (props) {
    super(props)

    this._inputRef = undefined

    this.state = {
      error: null,
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

  /**
   * Commits the given value into the autocomplete field and calls the
   * appropriate handler function.
   *
   * This function must be called only if the given value is valid. The
   * function does not check the validity on its own.
   *
   * @param  {string}  value  the value to commit
   */
  _commitValue (value) {
    const { onValueCommitted } = this.props

    this.setState({ value })

    if (onValueCommitted) {
      onValueCommitted(value)
    }
  }

  @autobind
  _onBlur (event, { highlightedSuggestion }) {
    const { value } = this.state
    if (this.validate(value)) {
      this._commitValue(value)
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
      suggestions: fetchSuggestions ? fetchSuggestions(value) : []
    })
  }

  @autobind
  _onValueChanged (event, { method, newValue }) {
    this.setState({
      value: newValue
    })

    if (method === 'enter' || method === 'click' || method === 'down' || method === 'up') {
      const shouldCommit = (method === 'enter' || method === 'click') &&
        this.validate(newValue)
      if (shouldCommit) {
        this._commitValue(newValue)
      }
    }
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
    const { error, suggestions, value } = this.state

    return (
      <Autosuggest
        getSuggestionValue={getSuggestionValue}
        highlightFirstSuggestion={highlightFirstSuggestion}
        inputProps={{
          autoFocus,
          placeholder,
          style,
          value,
          error: !!error,
          label: error || label,
          onBlur: this._onBlur,
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
   * Validates the current value of the field and sets the error state
   * appropriately.
   *
   * @param  {string}  value  the value to validate
   * @return {boolean} whether the current value is valid
   */
  validate (value) {
    const { allowEmpty, validateValue } = this.props
    let message = null
    let isValid = true

    if (value === '' && allowEmpty) {
      // Value is empty and it's okay to be so
    } else if (validateValue) {
      const result = validateValue(value)
      if (result === undefined || result === undefined || result === true) {
        // Value is valid, nothing to do
      } else if (result === false) {
        message = 'Invalid value'
        isValid = false
      } else {
        message = String(result)
        isValid = false
      }
    }

    this.setState({ error: message })

    return isValid
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
  allowEmpty: PropTypes.bool.isRequired,
  autoFocus: PropTypes.bool,
  fetchSuggestions: PropTypes.func,
  getSuggestionLabel: PropTypes.func.isRequired,
  getSuggestionValue: PropTypes.func.isRequired,
  highlightFirstSuggestion: PropTypes.bool,
  highlightMatches: PropTypes.bool,
  label: PropTypes.node,
  inputRef: PropTypes.func,
  onValueCommitted: PropTypes.func,
  placeholder: PropTypes.string,
  style: PropTypes.object,
  validateValue: PropTypes.func
}

AutoComplete.defaultProps = {
  allowEmpty: true,
  getSuggestionLabel: identity,
  getSuggestionValue: identity,
  highlightFirstSuggestion: true,
  highlightMatches: true
}
