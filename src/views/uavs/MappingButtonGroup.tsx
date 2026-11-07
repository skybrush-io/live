import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Check from '@mui/icons-material/Check';
import Edit from '@mui/icons-material/Edit';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import ViewList from '@mui/icons-material/ViewList';
import ViewModule from '@mui/icons-material/ViewModule';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
import { showSwapDronesDialog } from '~/features/uavs/swapping/slice';
import useDropdown from '~/hooks/useDropdown';
import type { AppThunk, RootState } from '~/store/reducers';

type MappingButtonGroupOwnProps = Record<string, never>;

type MappingButtonGroupStateProps = {
  layout: 'grid' | 'list';
  mappingEditable: boolean;
  showEmptyMissionSlots: boolean;
};

type MappingButtonGroupDispatchProps = {
  onShowSwapDronesDialog: () => void;
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
 * Buttons on the UAV toolbar that allow the user to edit the mission mapping,
 * with a dropdown menu of further mapping tools, and to select the layout of
 * the UAV list.
 */
const MappingButtonGroup = ({
  layout,
  mappingEditable,
  onShowSwapDronesDialog,
  onToggleShowingEmptyMissionSlots,
  setUAVListLayout,
  showEmptyMissionSlots,
  startMappingEditorSession,
}: MappingButtonGroupProps) => {
  const { t } = useTranslation();
  const [menuAnchorElement, openMenu, closeMenu, closeMenuWith] = useDropdown();

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

      <Tooltip content={t('mappingButtonGroup.moreMappingTools')}>
        <IconButton
          size='small'
          aria-label={t('mappingButtonGroup.moreMappingTools')}
          onClick={openMenu}
        >
          <ArrowDropDown />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={menuAnchorElement}
        open={menuAnchorElement !== null}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={closeMenuWith(() => {
            onShowSwapDronesDialog();
          })}
        >
          <ListItemIcon>
            <SwapHoriz />
          </ListItemIcon>
          <ListItemText>{t('mappingButtonGroup.swapDrones')}</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={mappingEditable}
          onClick={closeMenuWith(() => {
            onToggleShowingEmptyMissionSlots();
          })}
        >
          <ListItemIcon>{showEmptyMissionSlots && <Check />}</ListItemIcon>
          <ListItemText>
            {t('mappingButtonGroup.showEmptyMissionSlots')}
          </ListItemText>
        </MenuItem>
      </Menu>

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
    showEmptyMissionSlots:
      isShowingEmptyMissionSlots(state) || isMappingEditable(state),
  }),
  // mapDispatchToProps
  {
    clearMapping,
    onShowSwapDronesDialog: showSwapDronesDialog,
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
