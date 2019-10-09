import SettingsIcon from '@material-ui/icons/Settings';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { toggleAppSettingsDialog } from '~/actions/app-settings';

const AppSettingsButtonPresentation = ({ onClick, showLabel }) => {
  const classes = ['wb-module'];
  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className="wb-icon wb-module-icon">
        <SettingsIcon />
      </span>
      {showLabel ? (
        <span className="wb-label wb-module-label">App settings</span>
      ) : null}
    </div>
  );
};

AppSettingsButtonPresentation.propTypes = {
  onClick: PropTypes.func,
  showLabel: PropTypes.bool
};

export default connect(
  // mapStateToProps
  state => ({}),
  // mapDispatchToProps
  dispatch => ({
    onClick() {
      dispatch(toggleAppSettingsDialog());
    }
  })
)(AppSettingsButtonPresentation);
