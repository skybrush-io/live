import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar, { type ToolbarProps } from '@material-ui/core/Toolbar';
import Check from '@material-ui/icons/Check';
import Mouse from '@material-ui/icons/Mouse';
import MoreVert from '@material-ui/icons/MoreVert';
import OpenWith from '@material-ui/icons/OpenWith';

import {
  augmentMappingAutomaticallyFromSpareDrones,
  exportMapping,
  generateRandomMapping,
  importMapping,
  removeMissingUAVsFromMapping,
} from '~/features/mission/actions';
import { canAugmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/selectors';
import {
  clearMapping,
  finishMappingEditorSession,
} from '~/features/mission/slice';
import useDropdown from '~/hooks/useDropdown';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import type { RootState } from '~/store/reducers';

const instructionsStyle: React.CSSProperties = {
  overflow: 'ellipsis',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

type MappingEditorToolbarProps = ToolbarProps &
  Readonly<{
    augmentMapping: () => void;
    canAugmentMapping: boolean;
    clearMapping: () => void;
    devMode: boolean;
    exportMapping: () => void;
    finishMappingEditorSession: () => void;
    generateRandomMapping: () => void;
    importMapping: () => void;
    removeMissingUAVsFromMapping: () => void;
  }>;

const MappingEditorToolbar = React.forwardRef<
  HTMLDivElement,
  MappingEditorToolbarProps
>(
  (
    {
      augmentMapping,
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

    return (
      <Translation>
        {(t) => (
          <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
            <IconButton disabled>
              <Mouse />
            </IconButton>
            <Box style={instructionsStyle}>
              {t('mappingEditorToolbar.clickToEdit')}
            </Box>
            <IconButton disabled>
              <OpenWith />
            </IconButton>
            <Box style={instructionsStyle}>
              {t('mappingEditorToolbar.dragNodes')}
            </Box>
            <Box flex={1} />
            <IconButton onClick={finishMappingEditorSession}>
              <Check />
            </IconButton>
            <IconButton onClick={openMappingMenu}>
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
        )}
      </Translation>
    );
  }
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canAugmentMapping: canAugmentMappingAutomaticallyFromSpareDrones(state),
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
