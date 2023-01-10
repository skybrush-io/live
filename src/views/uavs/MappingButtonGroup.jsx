import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import Edit from '@material-ui/icons/Edit';
import ViewList from '@material-ui/icons/ViewList';
import ViewModule from '@material-ui/icons/ViewModule';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

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
  isShowingEmptyMissionSlots,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import MissingSlot from '~/icons/MissingSlot';

/**
 * Button on the UAV toolbar that allows the user to toggle whether the mission
 * mapping is being used. It also adds a dropdown menu to allow the user to
 * clear or edit the mapping.
 */
const MappingButtonGroup = ({
  layout,
  mappingEditable,
  onToggleShowingEmptyMissionSlots,
  setUAVListLayout,
  showEmptyMissionSlots,
  showMissionIds,
  startMappingEditorSession,
}) => (
  <>
    {showMissionIds && (
      <Tooltip content='Edit mapping'>
        <IconButton
          disabled={mappingEditable || !showMissionIds}
          onClick={startMappingEditorSession}
        >
          <Edit />
        </IconButton>
      </Tooltip>
    )}

    <MappingToggleButton />

    <Tooltip
      content={
        showEmptyMissionSlots
          ? 'Hide empty mission slots'
          : 'Show empty mission slots'
      }
    >
      <ToggleButton
        value='showMissing'
        disabled={!showMissionIds}
        selected={showEmptyMissionSlots}
        onClick={onToggleShowingEmptyMissionSlots}
      >
        <MissingSlot />
      </ToggleButton>
    </Tooltip>

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
  onToggleShowingEmptyMissionSlots: PropTypes.func,
  setUAVListLayout: PropTypes.func,
  showEmptyMissionSlots: PropTypes.bool,
  showMissionIds: PropTypes.bool,
  startMappingEditorSession: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    layout: getUAVListLayout(state),
    mappingEditable: isMappingEditable(state),
    showEmptyMissionSlots: isShowingEmptyMissionSlots(state),
    showMissionIds: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  {
    clearMapping,
    onToggleShowingEmptyMissionSlots: () => (dispatch, getState) => {
      const isShowing = isShowingEmptyMissionSlots(getState());
      dispatch(
        updateAppSettings('display', {
          hideEmptyMissionSlots: isShowing,
        })
      );
    },
    startMappingEditorSession,
    setUAVListLayout: (_event, value) => (dispatch) => {
      if (value) {
        dispatch(
          updateAppSettings('display', {
            uavListLayout: value,
          })
        );
      }
    },
  }
)(MappingButtonGroup);
