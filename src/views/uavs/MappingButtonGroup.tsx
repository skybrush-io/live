import Edit from '@mui/icons-material/Edit';
import ViewList from '@mui/icons-material/ViewList';
import ViewModule from '@mui/icons-material/ViewModule';
import IconButton from '@mui/material/IconButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ToggleButton from '~/components/ToggleButton';
import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { clearMapping } from '~/features/mission/actions';
import { isMappingEditable } from '~/features/mission/selectors';
import { startMappingEditorSession } from '~/features/mission/slice';
import {
  getUAVListLayout,
  isShowingEmptyMissionSlots,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import MissingSlot from '~/icons/MissingSlot';
import type { AppThunk, RootState } from '~/store/reducers';

type MappingButtonGroupOwnProps = Record<string, never>;

type MappingButtonGroupStateProps = {
  layout: 'grid' | 'list';
  mappingEditable: boolean;
  persistedShowEmptyMissionSlots: boolean;
  showEmptyMissionSlots: boolean;
};

type MappingButtonGroupDispatchProps = {
  onToggleShowingEmptyMissionSlots: () => void;
  startMappingEditorSession: () => void;
  setUAVListLayout: (
    _event: React.SyntheticEvent,
    value: string | null
  ) => void;
};

type MappingButtonGroupProps = MappingButtonGroupOwnProps &
  MappingButtonGroupStateProps &
  MappingButtonGroupDispatchProps;

/**
 * Button on the UAV toolbar that allows the user to toggle whether the mission
 * mapping is being used. It also adds a dropdown menu to allow the user to
 * clear or edit the mapping.
 */
const MappingButtonGroup = ({
  layout,
  mappingEditable,
  onToggleShowingEmptyMissionSlots,
  persistedShowEmptyMissionSlots,
  setUAVListLayout,
  showEmptyMissionSlots,
  startMappingEditorSession,
}: MappingButtonGroupProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Tooltip content={t('mappingButtonGroup.editMapping')}>
        <IconButton
          disabled={mappingEditable}
          onClick={startMappingEditorSession}
        >
          <Edit />
        </IconButton>
      </Tooltip>

      <Tooltip
        content={
          mappingEditable
            ? t('mappingButtonGroup.emptySlotsShownWhileEditingMapping')
            : persistedShowEmptyMissionSlots
              ? t('mappingButtonGroup.hideEmptyMissionSlots')
              : t('mappingButtonGroup.showEmptyMissionSlots')
        }
      >
        <ToggleButton
          value='showMissing'
          disabled={mappingEditable}
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
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const persistedShowEmptyMissionSlots = isShowingEmptyMissionSlots(state);
    return {
      layout: getUAVListLayout(state),
      mappingEditable: isMappingEditable(state),
      persistedShowEmptyMissionSlots,
      showEmptyMissionSlots:
        persistedShowEmptyMissionSlots || isMappingEditable(state),
    };
  },
  // mapDispatchToProps
  {
    clearMapping,
    onToggleShowingEmptyMissionSlots: (): AppThunk => (dispatch, getState) => {
      const isShowing = isShowingEmptyMissionSlots(getState());
      dispatch(
        updateAppSettings('display', {
          hideEmptyMissionSlots: isShowing,
        })
      );
    },
    startMappingEditorSession,
    setUAVListLayout:
      (_event: React.SyntheticEvent, value: string | null): AppThunk =>
      (dispatch) => {
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
