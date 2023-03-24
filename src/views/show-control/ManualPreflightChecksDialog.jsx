import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Switch from '@material-ui/core/Switch';

import {
  getTickedPreflightCheckItems,
  getHeadersAndItems,
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
        <ListItem
          key={itemId}
          button
          disableRipple
          onClick={() => onToggle(item.id)}
        >
          <ListItemIcon>
            <Checkbox
              checked={checkedItemIds.includes(item.id)}
              edge='start'
              inputProps={{ 'aria-labelledby': itemId }}
              value={item.id}
            />
          </ListItemIcon>
          <ListItemText id={itemId} primary={item.label} />
        </ListItem>
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
        <Box flex={1} overflow='auto' minHeight={0}>
          <PreflightCheckList />
        </Box>
        <Box className='bottom-bar' textAlign='center' pt={2}>
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
      <DialogActions />
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
