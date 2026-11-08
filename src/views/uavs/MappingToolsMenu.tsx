import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Check from '@mui/icons-material/Check';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  augmentMappingAutomaticallyFromSpareDrones,
  clearMapping,
  exportMapping,
  generateRandomMapping,
  importMapping,
  removeMissingUAVsFromMapping,
} from '~/features/mission/actions';
import {
  canAugmentMappingAutomaticallyFromSpareDrones,
  isMappingEditable,
} from '~/features/mission/selectors';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import { isShowingEmptyMissionSlots } from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import { showSwapDronesDialog } from '~/features/uavs/swapping/slice';
import useDropdown from '~/hooks/useDropdown';
import type { AppThunk, RootState } from '~/store/reducers';

type MappingToolsMenuProps = Readonly<{
  augmentMapping: () => void;
  canAugmentMapping: boolean;
  clearMapping: () => void;
  devMode: boolean;
  exportMapping: () => void;
  generateRandomMapping: () => void;
  importMapping: () => void;
  mappingEditable: boolean;
  onShowSwapDronesDialog: () => void;
  onToggleShowingEmptyMissionSlots: () => void;
  removeMissingUAVsFromMapping: () => void;
  showEmptyMissionSlots: boolean;
}>;

/**
 * Dropdown button with the mapping tools. Shown both in normal mode and while
 * the mapping editor is active.
 */
const MappingToolsMenu = ({
  augmentMapping,
  canAugmentMapping,
  clearMapping,
  devMode,
  exportMapping,
  generateRandomMapping,
  importMapping,
  mappingEditable,
  onShowSwapDronesDialog,
  onToggleShowingEmptyMissionSlots,
  removeMissingUAVsFromMapping,
  showEmptyMissionSlots,
}: MappingToolsMenuProps) => {
  const { t } = useTranslation();
  const [menuAnchorElement, openMenu, closeMenu, closeMenuWith] = useDropdown();

  return (
    <>
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
        <Divider />
        <MenuItem
          disabled={!canAugmentMapping}
          onClick={closeMenuWith(() => {
            augmentMapping();
          })}
        >
          <ListItemText inset>
            {t('mappingEditorToolbar.assignSpares')}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={closeMenuWith(() => {
            importMapping();
          })}
        >
          <ListItemText inset>
            {t('mappingEditorToolbar.importMapping')}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={closeMenuWith(() => {
            exportMapping();
          })}
        >
          <ListItemText inset>
            {t('mappingEditorToolbar.exportMapping')}
          </ListItemText>
        </MenuItem>
        <Divider />
        {devMode && (
          <MenuItem
            onClick={closeMenuWith(() => {
              generateRandomMapping();
            })}
          >
            <ListItemText inset>
              {t('mappingEditorToolbar.generateRandomMapping')}
            </ListItemText>
          </MenuItem>
        )}
        {devMode && <Divider />}
        <MenuItem
          onClick={closeMenuWith(() => {
            clearMapping();
          })}
        >
          <ListItemText inset>
            {t('mappingEditorToolbar.clearMapping')}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={closeMenuWith(() => {
            removeMissingUAVsFromMapping();
          })}
        >
          <ListItemText inset>
            {t('mappingEditorToolbar.clearMissing')}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canAugmentMapping: canAugmentMappingAutomaticallyFromSpareDrones(state),
    devMode: isDeveloperModeEnabled(state),
    mappingEditable: isMappingEditable(state),
    showEmptyMissionSlots:
      isShowingEmptyMissionSlots(state) || isMappingEditable(state),
  }),
  // mapDispatchToProps
  {
    augmentMapping: augmentMappingAutomaticallyFromSpareDrones,
    clearMapping,
    exportMapping,
    generateRandomMapping,
    importMapping,
    onShowSwapDronesDialog: showSwapDronesDialog,
    onToggleShowingEmptyMissionSlots: (): AppThunk => (dispatch, getState) => {
      const isShowing = isShowingEmptyMissionSlots(getState());
      dispatch(
        updateAppSettings('display', {
          hideEmptyMissionSlots: isShowing,
        })
      );
    },
    removeMissingUAVsFromMapping,
  }
)(MappingToolsMenu);
