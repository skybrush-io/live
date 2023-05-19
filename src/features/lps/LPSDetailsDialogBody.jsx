import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  getSelectedTabInLPSDetailsDialog,
  getSelectedLPSIdInLPSDetailsDialog,
} from './details';

const LPSDetailsDialogBody = ({ selectedTab, lpsId }) => {
  switch (selectedTab) {
    case 'anchors':
    default:
      return <div>Anchor list will come here</div>;
  }
};

LPSDetailsDialogBody.propTypes = {
  lpsId: PropTypes.string,
  selectedTab: PropTypes.oneOf(['anchors']),
};

export default connect(
  // mapStateToProps
  (state) => ({
    selectedTab: getSelectedTabInLPSDetailsDialog(state),
    lpsId: getSelectedLPSIdInLPSDetailsDialog(state),
  })
)(LPSDetailsDialogBody);
