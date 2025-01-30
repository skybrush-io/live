import { connect } from 'react-redux';

import { DrawingToolbar as DrawingToolbarPresentation } from '~/components/map';
import { getSelectedTool, setSelectedTool } from '~/features/map/tools';
import type { RootState } from '~/store/reducers';

/**
 * Drawing toolbar on the map.
 */
const DrawingToolbar = connect(
  // mapStateToProps
  (state: RootState) => ({
    selectedTool: getSelectedTool(state),
  }),
  // mapDispatchToProps
  {
    onToolSelected: setSelectedTool,
  }
)(DrawingToolbarPresentation);

export default DrawingToolbar;
