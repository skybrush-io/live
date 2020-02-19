import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import BackgroundHint from '~/components/BackgroundHint';
import DialogToolbar from '~/components/dialogs/DialogToolbar';
import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { isShowingMissionIds } from '~/features/settings/selectors';
import { signOffOnOnboardPreflightChecks } from '~/features/show/actions';
import { areOnboardPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearOnboardPreflightChecks,
  closeOnboardPreflightChecksDialog
} from '~/features/show/slice';
import { getErrorCodeSummaryForUAVsInMission } from '~/features/uavs/selectors';
import { describeError, getSeverityOfErrorCode } from '~/flockwave/errors';
import { formatMissionId } from '~/utils/formatting';
import MappingToggleButton from '~/views/uavs/MappingToggleButton';

const severityToStatus = [
  StepperStatus.INFO,
  StepperStatus.SKIPPED,
  StepperStatus.ERROR,
  StepperStatus.ERROR
];

/**
 * Formats a list of UAV IDs in a manner that is suitable for display in the
 * secondary text of a list item.
 *
 * @param  {string[]}  uavIds  the array of UAV IDs to format
 * @param  {number}    maxCount  the maximum number of UAV IDs to show before
 *         adding the "+X more" suffix
 * @return {string}  the formatted UAV ID list
 */
function formatUAVIds(uavIds, { maxCount = 8, separator = ' \u00B7 ' } = {}) {
  const length = Array.isArray(uavIds) ? uavIds.length : 0;
  if (length === 0) {
    return '';
  }

  if (length > maxCount) {
    return (
      uavIds.slice(0, maxCount - 1).join(separator) +
      ' and ' +
      (length - maxCount + 1) +
      ' more'
    );
  }

  return uavIds.join(separator);
}

/**
 * Presentation component that shows all the onboard preflight checks that have
 * failed on at least one of the drones, along with the IDs of the drones on
 * which the preflight checks have failed.
 */
const PreflightCheckListPresentation = ({ items, showMissionIds, ...rest }) =>
  items.length > 0 ? (
    <List dense disablePadding {...rest}>
      {items.map(item => {
        const itemId = `preflight-item-${item.code}`;
        const status = severityToStatus[getSeverityOfErrorCode(item.code)];
        return (
          <ListItem key={itemId} button disableRipple>
            <StepperStatusLight status={status} />
            <ListItemText
              id={itemId}
              primary={describeError(item.code)}
              secondary={formatUAVIds(
                item.uavIdsAndIndices.map(
                  showMissionIds
                    ? x => formatMissionId(x[1])
                    : x => String(x[0])
                )
              )}
            />
          </ListItem>
        );
      })}
    </List>
  ) : (
    <BackgroundHint
      header="Onboard preflight checks passed."
      text="None of the UAVs indicated an error."
    />
  );

PreflightCheckListPresentation.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string
    })
  ),
  onToggle: PropTypes.func,
  showMissionIds: PropTypes.bool
};

const PreflightCheckList = connect(
  // mapStateToProps
  state => ({
    items: getErrorCodeSummaryForUAVsInMission(state),
    showMissionIds: isShowingMissionIds(state)
  }),
  // mapDispatchToProps
  () => ({})
)(PreflightCheckListPresentation);

/**
 * Presentation component for the dialog that allows the user to inspect the
 * status of the automatic onboard preflight checks (and the error codes in
 * the fleet in general).
 */
const OnboardPreflightChecksDialog = ({
  open,
  onClear,
  onClose,
  onSignOff,
  signedOff
}) => {
  return (
    <Dialog fullWidth open={open} maxWidth="xs" onClose={onClose}>
      <DialogToolbar>
        <Typography variant="subtitle1">Onboard preflight checks</Typography>
        <Box flex={1} />
        <MappingToggleButton />
      </DialogToolbar>
      <DialogContent
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '1em',
          paddingRight: '1em'
        }}
      >
        <Box flex={1} overflow="auto" minHeight={240}>
          <PreflightCheckList />
        </Box>
        <Box className="bottom-bar" textAlign="center" pt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={signedOff}
                value="signedOff"
                onChange={signedOff ? onClear : onSignOff}
              />
            }
            label="Sign off on onboard preflight checks"
          />
        </Box>
      </DialogContent>
      <DialogActions />
    </Dialog>
  );
};

OnboardPreflightChecksDialog.propTypes = {
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onSignOff: PropTypes.func,
  open: PropTypes.bool,
  signedOff: PropTypes.bool
};

OnboardPreflightChecksDialog.defaultProps = {
  open: false,
  signedOff: false
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.onboardPreflightChecksDialog,
    signedOff: areOnboardPreflightChecksSignedOff(state)
  }),

  // mapDispatchToProps
  {
    onClear: clearOnboardPreflightChecks,
    onClose: closeOnboardPreflightChecksDialog,
    onSignOff: signOffOnOnboardPreflightChecks
  }
)(OnboardPreflightChecksDialog);
