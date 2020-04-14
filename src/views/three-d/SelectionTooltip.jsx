import { connect } from 'react-redux';
import { followCursor } from 'tippy.js';

import Tooltip from '~/components/Tooltip';

const plugins = [followCursor];

export default connect(
  // mapStateToProps
  (state) => ({
    content: state.threeD.tooltip || '',
    duration: 0,
    followCursor: true,
    hideOnClick: false,
    ignoreAttributes: true,
    visible: Boolean(state.threeD.tooltip),
    plugins,
  }),
  // mapDispatchToProps
  {}
)(Tooltip);
