import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  getSelectedTabInLPSDetailsDialog,
  getSelectedLPSIdInLPSDetailsDialog,
} from './details';
import AnchorStatusPanel from './AnchorStatusPanel';

const LPSDetailsDialogBody = ({ selectedTab, lpsId }) => {
  switch (selectedTab) {
    case 'anchors':
      return <AnchorStatusPanel lpsId={lpsId} />;
    default:
      return <div />;
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
