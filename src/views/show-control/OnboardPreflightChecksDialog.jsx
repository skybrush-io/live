import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';
import CheckCircle from '@material-ui/icons/CheckCircle';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Colors } from '~/components/colors';
import { Status } from '~/components/semantics';

import { isShowingMissionIds } from '~/features/settings/selectors';
import { signOffOnOnboardPreflightChecks } from '~/features/show/actions';
import { areOnboardPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearOnboardPreflightChecks,
  closeOnboardPreflightChecksDialog,
} from '~/features/show/slice';
import { getErrorCodeSummaryForUAVsInMission } from '~/features/uavs/selectors';
import { getSeverityOfErrorCode } from '~/flockwave/errors';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import {
  formatIdsAndTruncateTrailingItems as formatUAVIds,
  formatMissionId,
} from '~/utils/formatting';
import MappingToggleButton from '~/views/uavs/MappingToggleButton';

const severityToStatus = [
  Status.INFO,
  Status.SKIPPED,
  Status.ERROR,
  Status.ERROR,
];

/**
 * Presentation component that shows all the onboard preflight checks that have
 * failed on at least one of the drones, along with the IDs of the drones on
 * which the preflight checks have failed.
 */
const PreflightCheckListPresentation = ({
  items,
  showMissionIds,
  t,
  ...rest
}) =>
  items.length > 0 ? (
    <List dense disablePadding {...rest}>
      {items.map((item) => {
        const itemId = `preflight-item-${item.code}`;
        const status = severityToStatus[getSeverityOfErrorCode(item.code)];
        return (
          <ListItem key={itemId} button disableRipple>
            <StatusLight status={status} />
            <ListItemText
              id={itemId}
              primary={UAVErrorCode.describe(item.code)}
              secondary={formatUAVIds(
                item.uavIdsAndIndices.map(
                  showMissionIds
                    ? (x) => formatMissionId(x[1])
                    : (x) => String(x[0])
                )
              )}
            />
          </ListItem>
        );
      })}
    </List>
  ) : (
    <BackgroundHint
      header={t('OnboardPreflightChecksDialog.passed')}
      text={t('OnboardPreflightChecksDialog.noError')}
      icon={<CheckCircle />}
      iconColor={Colors.success}
    />
  );

PreflightCheckListPresentation.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
    })
  ),
  onToggle: PropTypes.func,
  showMissionIds: PropTypes.bool,
  t: PropTypes.func,
};

const PreflightCheckList = connect(
  // mapStateToProps
  (state) => ({
    items: getErrorCodeSummaryForUAVsInMission(state),
    showMissionIds: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  {}
)(withTranslation()(PreflightCheckListPresentation));

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
  signedOff,
  t,
}) => {
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='xs'
      title={t('show.onboardPreflightChecks')}
      titleComponents={<MappingToggleButton />}
      onClose={onClose}
    >
      <DialogContent
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: '1em',
          paddingRight: '1em',
        }}
      >
        <Box
          display='flex'
          flexDirection='column'
          justifyContent='center'
          flex={1}
          overflow='auto'
          minHeight={240}
        >
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
            label={t('OnboardPreflightChecksDialog.signOffOn')}
          />
        </Box>
      </DialogContent>
      <DialogActions />
    </DraggableDialog>
  );
};

OnboardPreflightChecksDialog.propTypes = {
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onSignOff: PropTypes.func,
  open: PropTypes.bool,
  signedOff: PropTypes.bool,
  t: PropTypes.func,
};

OnboardPreflightChecksDialog.defaultProps = {
  open: false,
  signedOff: false,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.onboardPreflightChecksDialog,
    signedOff: areOnboardPreflightChecksSignedOff(state),
  }),

  // mapDispatchToProps
  {
    onClear: clearOnboardPreflightChecks,
    onClose: closeOnboardPreflightChecksDialog,
    onSignOff: signOffOnOnboardPreflightChecks,
  }
)(withTranslation()(OnboardPreflightChecksDialog));
