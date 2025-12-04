import Check from '@mui/icons-material/Check';
import MoreVert from '@mui/icons-material/MoreVert';
import Mouse from '@mui/icons-material/Mouse';
import OpenWith from '@mui/icons-material/OpenWith';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar, { type ToolbarProps } from '@mui/material/Toolbar';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Colors from '~/components/colors';
import {
  augmentMappingAutomaticallyFromSpareDrones,
  exportMapping,
  generateRandomMapping,
  importMapping,
  removeMissingUAVsFromMapping,
} from '~/features/mission/actions';
import {
  canAugmentMappingAutomaticallyFromSpareDrones,
  isMappingBeingCalculated,
} from '~/features/mission/selectors';
import {
  clearMapping,
  finishMappingEditorSession,
} from '~/features/mission/slice';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import useDropdown from '~/hooks/useDropdown';
import type { RootState } from '~/store/reducers';
import MappingCalculationInProgress from './MappingCalculationInProgress';

const instructionsStyle: React.CSSProperties = {
  overflow: 'ellipsis',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

type MappingEditorToolbarProps = ToolbarProps &
  Readonly<{
    augmentMapping: () => void;
    canAugmentMapping: boolean;
    calculating: boolean;
    clearMapping: () => void;
    devMode: boolean;
    exportMapping: () => void;
    finishMappingEditorSession: () => void;
    generateRandomMapping: () => void;
    importMapping: () => void;
    removeMissingUAVsFromMapping: () => void;
  }>;

const Instructions = () => {
  const { t } = useTranslation();
  return (
    <>
      <IconButton disabled size='large'>
        <Mouse />
      </IconButton>
      <Box style={instructionsStyle}>
        {t('mappingEditorToolbar.clickToEdit')}
      </Box>
      <IconButton disabled size='large'>
        <OpenWith />
      </IconButton>
      <Box style={instructionsStyle}>{t('mappingEditorToolbar.dragNodes')}</Box>
    </>
  );
};

const MappingEditorToolbar = React.forwardRef<
  HTMLDivElement,
  MappingEditorToolbarProps
>(
  (
    {
      augmentMapping,
      calculating,
      canAugmentMapping,
      clearMapping,
      devMode,
      exportMapping,
      finishMappingEditorSession,
      generateRandomMapping,
      importMapping,
      removeMissingUAVsFromMapping,
      ...rest
    },
    ref
  ) => {
    const [
      menuAnchorElement,
      openMappingMenu,
      closeMappingMenu,
      closeMappingMenuWith,
    ] = useDropdown();
    const { t } = useTranslation();

    return (
      <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
        {calculating ? (
          <Box pl={2}>
            <MappingCalculationInProgress size='small' />
          </Box>
        ) : (
          <Instructions />
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton size='large' onClick={finishMappingEditorSession}>
          <Check htmlColor={Colors.success} />
        </IconButton>
        <IconButton size='large' onClick={openMappingMenu}>
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={menuAnchorElement}
          open={menuAnchorElement !== null}
          variant='menu'
          onClose={closeMappingMenu}
        >
          <MenuItem
            disabled={!canAugmentMapping}
            onClick={
              canAugmentMapping
                ? closeMappingMenuWith(augmentMapping)
                : undefined
            }
          >
            {t('mappingEditorToolbar.assignSpares')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={closeMappingMenuWith(importMapping)}>
            {t('mappingEditorToolbar.importMapping')}
          </MenuItem>
          <MenuItem onClick={closeMappingMenuWith(exportMapping)}>
            {t('mappingEditorToolbar.exportMapping')}
          </MenuItem>
          <Divider />
          {devMode && (
            <MenuItem onClick={closeMappingMenuWith(generateRandomMapping)}>
              {t('mappingEditorToolbar.generateRandomMapping')}
            </MenuItem>
          )}
          {devMode && <Divider />}
          <MenuItem onClick={closeMappingMenuWith(clearMapping)}>
            {t('general.action.clear')}
          </MenuItem>
          <MenuItem
            onClick={closeMappingMenuWith(removeMissingUAVsFromMapping)}
          >
            {t('mappingEditorToolbar.clearMissing')}
          </MenuItem>
        </Menu>
      </Toolbar>
    );
  }
);
MappingEditorToolbar.displayName = 'MappingEditorToolbar';

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canAugmentMapping: canAugmentMappingAutomaticallyFromSpareDrones(state),
    calculating: isMappingBeingCalculated(state),
    devMode: isDeveloperModeEnabled(state),
  }),
  // mapDispatchToProps
  {
    augmentMapping: augmentMappingAutomaticallyFromSpareDrones,
    clearMapping,
    exportMapping,
    generateRandomMapping,
    importMapping,
    finishMappingEditorSession,
    removeMissingUAVsFromMapping,
  },
  null,
  { forwardRef: true }
)(MappingEditorToolbar);
