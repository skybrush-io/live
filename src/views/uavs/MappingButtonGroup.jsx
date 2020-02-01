import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Edit from '@material-ui/icons/Edit';
import MoreVert from '@material-ui/icons/MoreVert';
import ToggleButton from '@material-ui/lab/ToggleButton';

import { isMappingEditable } from '~/features/mission/selectors';
import { isShowingMissionIds } from '~/features/settings/selectors';
import {
  clearMapping,
  toggleMappingIsEditable
} from '~/features/mission/slice';
import { toggleMissionIds } from '~/features/settings/slice';
import useDropdown from '~/hooks/useDropdown';

const useStyles = makeStyles(
  () => ({
    toggleButton: {
      border: 0
    }
  }),
  { name: 'MappingButton' }
);

/**
 * Button on the UAV toolbar that allows the user to toggle whether the mission
 * mapping is being used. It also adds a dropdown menu to allow the user to
 * clear or edit the mapping.
 */
const MappingButtonGroup = ({
  clearMapping,
  mappingEditable,
  showMissionIds,
  toggleMappingIsEditable,
  toggleMissionIds
}) => {
  const [menuAnchorEl, openMappingMenu, closeMappingMenu] = useDropdown();
  const classes = useStyles();

  return (
    <>
      <ToggleButton
        className={classes.toggleButton}
        size="small"
        value="missionIds"
        selected={showMissionIds}
        onChange={toggleMissionIds}
      >
        Mapping
      </ToggleButton>
      <ToggleButton
        className={classes.toggleButton}
        size="small"
        value="editMode"
        disabled={!showMissionIds}
        selected={mappingEditable}
        onChange={toggleMappingIsEditable}
      >
        <Edit />
      </ToggleButton>
      <IconButton onClick={openMappingMenu}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={menuAnchorEl}
        open={menuAnchorEl !== null}
        variant="menu"
        onClose={closeMappingMenu}
      >
        <MenuItem disabled>Import...</MenuItem>
        <MenuItem disabled>Export...</MenuItem>
        <Divider />
        <MenuItem onClick={closeMappingMenu(clearMapping)}>Clear</MenuItem>
      </Menu>
    </>
  );
};

MappingButtonGroup.propTypes = {
  clearMapping: PropTypes.func,
  mappingEditable: PropTypes.bool,
  showMissionIds: PropTypes.bool,
  toggleMappingIsEditable: PropTypes.func,
  toggleMissionIds: PropTypes.func
};

export default connect(
  // mapStateToProps
  state => ({
    mappingEditable: isMappingEditable(state),
    showMissionIds: isShowingMissionIds(state)
  }),
  // mapDispatchToProps
  { clearMapping, toggleMappingIsEditable, toggleMissionIds }
)(MappingButtonGroup);
