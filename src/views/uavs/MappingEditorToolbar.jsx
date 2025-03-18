import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
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

const instructionsStyle = {
  overflow: 'ellipsis',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

const MappingEditorToolbar = React.forwardRef(
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
    const [menuAnchorElement, openMappingMenu, closeMappingMenu] =
      useDropdown();

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
                  canAugmentMapping ? closeMappingMenu(augmentMapping) : null
                }
              >
                {t('mappingEditorToolbar.assignSpares')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={closeMappingMenu(importMapping)}>
                {t('mappingEditorToolbar.importMapping')}
              </MenuItem>
              <MenuItem onClick={closeMappingMenu(exportMapping)}>
                {t('mappingEditorToolbar.exportMapping')}
              </MenuItem>
              <Divider />
              {devMode && (
                <MenuItem onClick={closeMappingMenu(generateRandomMapping)}>
                  {t('mappingEditorToolbar.generateRandomMapping')}
                </MenuItem>
              )}
              {devMode && <Divider />}
              <MenuItem onClick={closeMappingMenu(clearMapping)}>
                {t('general.action.clear')}
              </MenuItem>
              <MenuItem
                onClick={closeMappingMenu(removeMissingUAVsFromMapping)}
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

MappingEditorToolbar.propTypes = {
  augmentMapping: PropTypes.func,
  canAugmentMapping: PropTypes.bool,
  clearMapping: PropTypes.func,
  devMode: PropTypes.bool,
  exportMapping: PropTypes.func,
  finishMappingEditorSession: PropTypes.func,
  generateRandomMapping: PropTypes.func,
  importMapping: PropTypes.func,
  isDeveloperModeEnabled: PropTypes.bool,
  removeMissingUAVsFromMapping: PropTypes.func,
  selectedUAVIds: PropTypes.array,
};

export default connect(
  // mapStateToProps
  (state) => ({
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
