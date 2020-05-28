import PropTypes from 'prop-types';
import React from 'react';
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
  ({ clearMapping, finishMappingEditorSession, ...rest }, ref) => {
    const [
      menuAnchorElement,
      openMappingMenu,
      closeMappingMenu,
    ] = useDropdown();

    return (
      <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
        <IconButton disabled>
          <Mouse />
        </IconButton>
        <Box style={instructionsStyle}>Click to edit a single slot.</Box>
        <IconButton disabled>
          <OpenWith />
        </IconButton>
        <Box style={instructionsStyle}>
          Drag nodes to rearrange the mapping.
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
          <MenuItem disabled>Import…</MenuItem>
          <MenuItem disabled>Export…</MenuItem>
          <Divider />
          <MenuItem onClick={closeMappingMenu(clearMapping)}>Clear</MenuItem>
        </Menu>
      </Toolbar>
    );
  }
);

MappingEditorToolbar.propTypes = {
  clearMapping: PropTypes.func,
  finishMappingEditorSession: PropTypes.func,
  selectedUAVIds: PropTypes.array,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  { clearMapping, finishMappingEditorSession },
  null,
  { forwardRef: true }
)(MappingEditorToolbar);
