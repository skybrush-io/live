import Edit from '@mui/icons-material/Edit';
import ViewList from '@mui/icons-material/ViewList';
import ViewModule from '@mui/icons-material/ViewModule';
import IconButton from '@mui/material/IconButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ToggleButton from '~/components/ToggleButton';
import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
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

import MappingToggleButton from './MappingToggleButton';

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
  t,
}) => (
  <>
    {showMissionIds && (
      <Tooltip content={t('mappingButtonGroup.editMapping')}>
        <IconButton
          disabled={mappingEditable || !showMissionIds}
          size='large'
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
          ? t('mappingButtonGroup.hideEmptyMissionSlots')
          : t('mappingButtonGroup.showEmptyMissionSlots')
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
  t: PropTypes.func,
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
)(withTranslation()(MappingButtonGroup));
