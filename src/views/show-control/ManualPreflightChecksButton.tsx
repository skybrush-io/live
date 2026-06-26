import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { hasManualPreflightChecks } from '~/features/preflight/selectors';
import { areManualPreflightChecksSignedOff } from '~/features/show/selectors';
import { openManualPreflightChecksDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import type { RootState } from '~/store/reducers';

type Props = {
  hasManualChecks: boolean;
  status: Status;
} & ListItemButtonProps;

/**
 * Component with a button that shows a dialog that allows the user to verify
 * the fulfillment of the manual preflight criteria.
 */
const ManualPreflightChecksButton = ({
  hasManualChecks,
  status,
  ...rest
}: Props) => {
  const { t } = useTranslation();

  return hasManualChecks ? (
    <ListItem disablePadding>
      <ListItemButton disabled={status === Status.OFF} {...rest}>
        <StatusLight status={status} />
        <ListItemText primary={t('show.manualPreflightChecks')} />
      </ListItemButton>
    </ListItem>
  ) : null;
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    areChecksSignedOff: areManualPreflightChecksSignedOff(state),
    hasManualChecks: hasManualPreflightChecks(state),
    status: getSetupStageStatuses(state).performManualPreflightChecks,
  }),
  // mapDispatchToProps
  {
    onClick: openManualPreflightChecksDialog,
  }
)(ManualPreflightChecksButton);
