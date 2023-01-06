/**
 * @file React Component for handling hotkeys.
 */

import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { getApplicationKeyMap } from 'react-hotkeys';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { isRunningOnMac, platformModifierKey } from '~/utils/platform';

import { HIDDEN } from './keymap';
import { isHotkeyDialogVisible } from './selectors';
import { closeHotkeyDialog } from './slice';

/**
 * Formats the given hotkey sequence to make it suitable for the user.
 *
 * This function replaces all occurrences of "Cmd" with the standard
 * "command" symbol and all occurrences of "Alt" with the standard
 * "option" symbol on a Mac (i.e. Unicode code points U+2318 and U+2325).
 * It also replaces "Shift" with the standard "shift" symbol (Unicode code
 * point U+21E7) on all platforms, "PlatMod" with "Ctrl" on Windows and the
 * "command" symbol on a Mac, gets rid of the "Key" prefix and wraps each
 * key in a <code>&lt;kbd&gt;</code> tag.
 *
 * @param {string} definition  the hotkey sequence to format
 * @return {array} the formatted hotkey definition as an array of JSX tags
 */
function formatKeySequence(definition) {
  if (typeof definition !== 'string') {
    return null;
  }

  return definition.split('+').map((key) => {
    const formattedKey = key
      .trim()
      .toLowerCase()
      .replace(/^mod$/, platformModifierKey)
      .replace(/^cmd$/, '⌘')
      .replace(/^meta$/, '⌘')
      .replace(/^alt$/, isRunningOnMac ? '⌥' : 'Alt')
      .replace(/^shift/, '⇧')
      .replace(/^del$/, isRunningOnMac ? '⌦' : 'Delete');
    return (
      <kbd key={key}>
        {formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)}
      </kbd>
    );
  });
}

const keysColumnStyle = { width: 120 };
const nameColumnStyle = { maxWidth: '99%' };

const HotkeyRow = ({ name, sequences }) => (
  <TableRow>
    <TableCell style={keysColumnStyle} padding='none'>
      {sequences.map(({ sequence }) => formatKeySequence(sequence))}
    </TableCell>
    <TableCell style={nameColumnStyle}>{name}</TableCell>
  </TableRow>
);

HotkeyRow.propTypes = {
  name: PropTypes.string,
  sequences: PropTypes.arrayOf(
    PropTypes.shape({
      sequence: PropTypes.string,
    })
  ),
};

/**
 * Dialog that shows the current list of hotkeys.
 */
const HotkeyDialog = ({ onClose, open }) => {
  const [hotkeys, setHotkeys] = useState(() => getApplicationKeyMap());

  useEffect(() => {
    setHotkeys(getApplicationKeyMap());
  }, [open]);

  return (
    <DraggableDialog title='Hotkeys' open={open} onClose={onClose}>
      <DialogContent>
        <Table size='small'>
          <TableBody>
            {Object.keys(hotkeys || {}).map(
              (hotkey) =>
                hotkeys[hotkey].group !== HIDDEN && (
                  <HotkeyRow key={hotkey} {...hotkeys[hotkey]} />
                )
            )}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button color='primary' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

HotkeyDialog.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: isHotkeyDialogVisible(state),
  }),
  // mapDispatchToProps
  {
    onClose: closeHotkeyDialog,
  }
)(HotkeyDialog);
