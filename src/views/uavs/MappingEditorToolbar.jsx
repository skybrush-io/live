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
  importMapping,
  removeMissingUAVsFromMapping,
} from '~/features/mission/actions';
import { canAugmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/selectors';
import {
  clearMapping,
  finishMappingEditorSession,
} from '~/features/mission/slice';
import useDropdown from '~/hooks/useDropdown';

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
      exportMapping,
      finishMappingEditorSession,
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
  exportMapping: PropTypes.func,
  finishMappingEditorSession: PropTypes.func,
  importMapping: PropTypes.func,
  removeMissingUAVsFromMapping: PropTypes.func,
  selectedUAVIds: PropTypes.array,
};

export default connect(
  // mapStateToProps
  (state) => ({
    canAugmentMapping: canAugmentMappingAutomaticallyFromSpareDrones(state),
  }),
  // mapDispatchToProps
  {
    augmentMapping: augmentMappingAutomaticallyFromSpareDrones,
    clearMapping,
    exportMapping,
    importMapping,
    finishMappingEditorSession,
    removeMissingUAVsFromMapping,
  },
  null,
  { forwardRef: true }
)(MappingEditorToolbar);
