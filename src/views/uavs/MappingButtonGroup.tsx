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
import { isMappingEditable } from '~/features/mission/selectors';
import { startMappingEditorSession } from '~/features/mission/slice';
import { getUAVListLayout } from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import type { AppThunk, RootState } from '~/store/reducers';

import MappingToolsMenu from './MappingToolsMenu';

type MappingButtonGroupOwnProps = Record<string, never>;

type MappingButtonGroupStateProps = {
  layout: 'grid' | 'list';
  mappingEditable: boolean;
};

type MappingButtonGroupDispatchProps = {
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
 * Buttons on the UAV toolbar that allow the user to edit the mission mapping,
 * with a dropdown menu of further mapping tools, and to select the layout of
 * the UAV list.
 */
const MappingButtonGroup = ({
  layout,
  mappingEditable,
  setUAVListLayout,
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

      <MappingToolsMenu />

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
  (state: RootState) => ({
    layout: getUAVListLayout(state),
    mappingEditable: isMappingEditable(state),
  }),
  // mapDispatchToProps
  {
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
