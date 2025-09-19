import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  getHeadersAndItems,
  getTickedPreflightCheckItems,
} from '~/features/preflight/selectors';
import { togglePreflightCheckStatus } from '~/features/preflight/slice';
import { signOffOnManualPreflightChecks } from '~/features/show/actions';
import { areManualPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearManualPreflightChecks,
  closeManualPreflightChecksDialog,
} from '~/features/show/slice';

/**
 * Presentation component that shows a list of manual preflight checks and
 * whether they have been checked or not.
 */
const PreflightCheckListPresentation = ({
  checkedItemIds,
  items,
  onToggle,
  ...rest
}) => (
  <List dense disablePadding={items.length > 0} {...rest}>
    {items.map((item) => {
      if (item.type === 'header') {
        return (
          <ListSubheader key={`preflight-header-${item.id}`}>
            {item.label}
          </ListSubheader>
        );
      }

      const itemId = `preflight-item-${item.id}`;
      return (
        <ListItemButton
          key={itemId}
          disableRipple
          onClick={() => onToggle(item.id)}
        >
          <ListItemIcon>
            <Checkbox
              checked={checkedItemIds.includes(item.id)}
              edge='start'
              slotProps={{ input: { 'aria-labelledby': itemId } }}
              value={item.id}
            />
          </ListItemIcon>
          <ListItemText id={itemId} primary={item.label} />
        </ListItemButton>
      );
    })}
    {items.length === 0 && (
      <ListItem>
        <ListItemText
          primary='There are no manual preflight check items.'
          secondary='You can add them in the Settings dialog.'
        />
      </ListItem>
    )}
  </List>
);

PreflightCheckListPresentation.propTypes = {
  checkedItemIds: PropTypes.arrayOf(PropTypes.string),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
    })
  ),
  onToggle: PropTypes.func,
};

const PreflightCheckList = connect(
  // mapStateToProps
  (state) => ({
    checkedItemIds: getTickedPreflightCheckItems(state),
    items: getHeadersAndItems(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onToggle(id) {
      dispatch(togglePreflightCheckStatus(id));
    },
  })
)(PreflightCheckListPresentation);

/**
 * Presentation component for the dialog that allows the user to inspect the
 * status of the manual preflight checks (and the error codes in
 * the fleet in general).
 */
const ManualPreflightChecksDialog = ({
  open,
  onClear,
  onClose,
  onSignOff,
  signedOff,
}) => {
  return (
    <Dialog fullWidth open={open} maxWidth='xs' onClose={onClose}>
      <DialogContent
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '1em',
          paddingRight: '1em',
        }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <PreflightCheckList />
        </Box>
        <Box className='bottom-bar' sx={{ textAlign: 'center', pt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={signedOff}
                value='signedOff'
                onChange={signedOff ? onClear : onSignOff}
              />
            }
            label='Sign off on manual preflight checks'
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

ManualPreflightChecksDialog.propTypes = {
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onSignOff: PropTypes.func,
  open: PropTypes.bool,
  signedOff: PropTypes.bool,
};

ManualPreflightChecksDialog.defaultProps = {
  open: false,
  signedOff: false,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.manualPreflightChecksDialog,
    signedOff: areManualPreflightChecksSignedOff(state),
  }),

  // mapDispatchToProps
  {
    onClear: clearManualPreflightChecks,
    onClose: closeManualPreflightChecksDialog,
    onSignOff: signOffOnManualPreflightChecks,
  }
)(ManualPreflightChecksDialog);
