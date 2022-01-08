import { connect } from 'react-redux';
import { followCursor } from 'tippy.js';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

const plugins = [followCursor];

export default connect(
  // mapStateToProps
  (state) => ({
    content: state.threeD.tooltip || '',
    duration: 0,
    followCursor: true,
    ignoreAttributes: true,
    visible: Boolean(state.threeD.tooltip),
    plugins,
  }),
  // mapDispatchToProps
  {}
)(Tooltip);
