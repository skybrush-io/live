import PropTypes from 'prop-types';
import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import Zoom from '@material-ui/core/Zoom';
import Edit from '@material-ui/icons/Edit';
import ViewList from '@material-ui/icons/ViewList';
import ViewModule from '@material-ui/icons/ViewModule';

import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import AugmentMappingButton from './AugmentMappingButton';
import MappingToggleButton from './MappingToggleButton';

import ToggleButton from '~/components/ToggleButton';
import ToolbarDivider from '~/components/ToolbarDivider';
import { isMappingEditable } from '~/features/mission/selectors';
import {
  clearMapping,
  startMappingEditorSession,
} from '~/features/mission/slice';
import {
  getUAVListLayout,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';

/**
 * Button on the UAV toolbar that allows the user to toggle whether the mission
 * mapping is being used. It also adds a dropdown menu to allow the user to
 * clear or edit the mapping.
 */
const MappingButtonGroup = ({
  layout,
  mappingEditable,
  setUAVListLayout,
  showMissionIds,
  startMappingEditorSession,
}) => (
  <>
    <TransitionGroup>
      {showMissionIds && (
        <Zoom key='editMapping'>
          <IconButton
            disabled={mappingEditable || !showMissionIds}
            onClick={startMappingEditorSession}
          >
            <Edit />
          </IconButton>
        </Zoom>
      )}
      {showMissionIds && (
        <Zoom key='automap'>
          <AugmentMappingButton />
        </Zoom>
      )}
    </TransitionGroup>

    <MappingToggleButton />

    <ToolbarDivider orientation='vertical' />

    <ToggleButtonGroup exclusive value={layout} onChange={setUAVListLayout}>
      <ToggleButton size='small' value='grid'>
        <ViewModule />
      </ToggleButton>
      <ToggleButton size='small' value='list'>
        <ViewList />
      </ToggleButton>
    </ToggleButtonGroup>
  </>
);

MappingButtonGroup.propTypes = {
  layout: PropTypes.oneOf(['grid', 'list']),
  mappingEditable: PropTypes.bool,
  setUAVListLayout: PropTypes.func,
  showMissionIds: PropTypes.bool,
  startMappingEditorSession: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    layout: getUAVListLayout(state),
    mappingEditable: isMappingEditable(state),
    showMissionIds: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  {
    clearMapping,
    startMappingEditorSession,
    setUAVListLayout: (_event, value) =>
      updateAppSettings('display', {
        uavListLayout: value,
      }),
  }
)(MappingButtonGroup);
