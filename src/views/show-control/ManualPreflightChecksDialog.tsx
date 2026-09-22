import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import List, { type ListProps } from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import {
  getHeadersAndItems,
  getTickedPreflightCheckItems,
} from '~/features/preflight/selectors';
import { togglePreflightCheckStatus } from '~/features/preflight/slice';
import { type PreflightCheckHeaderOrItem } from '~/features/preflight/types';
import { signOffOnManualPreflightChecks } from '~/features/show/actions';
import { areManualPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearManualPreflightChecks,
  closeManualPreflightChecksDialog,
} from '~/features/show/slice';
import type { AppDispatch, RootState } from '~/store/reducers';

type PreflightCheckListPresentationProps = Omit<ListProps, 'onToggle'> & {
  checkedItemIds: string[];
  items: PreflightCheckHeaderOrItem[];
  onToggle: (id: string) => void;
};

/**
 * Presentation component that shows a list of manual preflight checks and
 * whether they have been checked or not.
 */
const PreflightCheckListPresentation = ({
  checkedItemIds,
  items,
  onToggle,
  ...rest
}: PreflightCheckListPresentationProps) => (
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
        <ListItem key={itemId} disablePadding>
          <ListItemButton disableRipple onClick={() => onToggle(item.id)}>
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

const PreflightCheckList = connect(
  // mapStateToProps
  (state: RootState) => ({
    checkedItemIds: getTickedPreflightCheckItems(state),
    items: getHeadersAndItems(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onToggle(id: string) {
      dispatch(togglePreflightCheckStatus(id));
    },
  })
)(PreflightCheckListPresentation);

type ManualPreflightChecksDialogProps = {
  open?: boolean;
  onClear: () => void;
  onClose: () => void;
  onSignOff: () => void;
  signedOff?: boolean;
};

/**
 * Presentation component for the dialog that allows the user to inspect the
 * status of the manual preflight checks (and the error codes in
 * the fleet in general).
 */
const ManualPreflightChecksDialog = ({
  open = false,
  onClear,
  onClose,
  onSignOff,
  signedOff = false,
}: ManualPreflightChecksDialogProps) => {
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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
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
