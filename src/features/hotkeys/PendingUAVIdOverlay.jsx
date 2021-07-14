import { connect } from 'react-redux';

import QuickSelectionOverlay from '@skybrush/mui-components/lib/QuickSelectionOverlay';

import { getPendingUAVId } from '~/features/hotkeys/selectors';

export default connect(
  // mapStateToProps
  (state) => {
    const id = getPendingUAVId(state);
    return {
      text: id,
      open: id.length > 0,
    };
  },
  // mapDispatchToProps
  {}
)(QuickSelectionOverlay);
