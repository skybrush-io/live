import { connect } from 'react-redux';

import MessagesPanel from '~/components/chat/MessagesPanel';
import { getSingleSelectedUAVId } from '~/selectors/selection';

export default connect(
  // mapStateToProps
  (state) => ({
    uavId: getSingleSelectedUAVId(state),
  }),
  // mapDispatchToProps
  {}
)(MessagesPanel);
