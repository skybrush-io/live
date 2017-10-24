/**
 * @file Component that gives a hint to the user about the usage of the
 * application.
 */

import PropTypes from 'prop-types'
import React from 'react'

/**
 * Component that gives a hint to the user about the usage of the
 * application.
 *
 * The hint is presented as text in large print placed in the middle of
 * the area dedicated to the component.
 *
 * @return {Object} the rendered component
 */
const BackgroundHint = ({ header, text }) => (
  <div className={'background-hint'}>
    <div>
      <div className={'header'}>{ header }</div>
      <div className={'text'}>{ text }</div>
    </div>
  </div>
)

BackgroundHint.propTypes = {
  header: PropTypes.string,
  text: PropTypes.string
}

export default BackgroundHint
