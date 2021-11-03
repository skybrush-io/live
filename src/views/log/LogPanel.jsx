/**
 * @file Component for displaying logged messages.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useEffectOnce } from 'react-use';

import { updateLogPanelVisibility } from '~/features/log/slice';

import LogMessageList from './LogMessageList';

const LogPanel = ({ items, updateLogPanelVisibility }) => {
  useEffectOnce(() => {
    updateLogPanelVisibility(true);
    return () => updateLogPanelVisibility(false);
  });

  return <LogMessageList items={items} />;
};

LogPanel.propTypes = {
  items: PropTypes.array,
  updateLogPanelVisibility: PropTypes.func.isRequired,
};

export default connect(
  // mapStateToProps
  (state) => ({
    items: state.log.items,
  }),
  // mapDispatchToProps
  { updateLogPanelVisibility }
)(LogPanel);
