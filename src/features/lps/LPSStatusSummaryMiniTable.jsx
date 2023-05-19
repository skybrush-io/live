import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { MiniTable } from '~/components/mini-table';

import { getLocalPositioningSystemById } from './selectors';

const createMiniTableContentsSelector = () =>
  createSelector(getLocalPositioningSystemById, (lps) => {
    const anchors = lps?.anchors;
    return [
      ['Type', lps?.type],
      ['# anchors', Array.isArray(anchors) ? anchors.length : 0],
    ];
  });

export default connect(
  // mapStateToProps
  () => {
    const selector = createMiniTableContentsSelector();
    return (state, ownProps) => ({
      items: selector(state, ownProps.lpsId),
    });
  },
  // mapDispatchToProps
  {}
)(MiniTable);
