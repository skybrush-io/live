import CheckCircle from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import { useTranslation, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  BackgroundHint,
  DraggableDialog,
  StatusLight,
} from '@skybrush/mui-components';

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
  formatMissionId,
  formatIdsAndTruncateTrailingItems as formatUAVIds,
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
const PreflightCheckListPresentation = ({ items, showMissionIds, ...rest }) => {
  const { t } = useTranslation();

  return items.length > 0 ? (
    <List dense disablePadding {...rest}>
      {items.map((item) => {
        const itemId = `preflight-item-${item.code}`;
        const status = severityToStatus[getSeverityOfErrorCode(item.code)];
        return (
          <ListItemButton key={itemId} button disableRipple>
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
          </ListItemButton>
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
};

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
)(PreflightCheckListPresentation);

/**
 * Presentation component for the dialog that allows the user to inspect the
 * status of the automatic onboard preflight checks (and the error codes in
 * the fleet in general).
 */
const OnboardPreflightChecksDialog = ({
  open = false,
  onClear,
  onClose,
  onSignOff,
  signedOff = false,
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
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            overflow: 'auto',
            minHeight: '240px',
          }}
        >
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
            label={t('OnboardPreflightChecksDialog.signOffOn')}
          />
        </Box>
      </DialogContent>
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
