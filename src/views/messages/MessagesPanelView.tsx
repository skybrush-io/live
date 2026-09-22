import { connect } from 'react-redux';

import MessagesPanel from '~/components/chat/MessagesPanel';
import { getSingleSelectedUAVId } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    uavId: getSingleSelectedUAVId(state),
  }),
  // mapDispatchToProps
  {}
)(MessagesPanel);
