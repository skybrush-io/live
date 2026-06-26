import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { openOnboardPreflightChecksDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import type { RootState } from '~/store/reducers';

type Props = {
  status: Status;
} & ListItemButtonProps;

/**
 * Component with a button that shows a dialog that allows the user to check the
 * results of the onboard preflight checks on the drones.
 */
const OnboardPreflightChecksButton = ({ status, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding>
      <ListItemButton disabled={status === Status.OFF} {...rest}>
        <StatusLight status={status} />
        <ListItemText primary={t('show.onboardPreflightChecks')} />
      </ListItemButton>
    </ListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    status: getSetupStageStatuses(state).waitForOnboardPreflightChecks,
  }),
  // mapDispatchToProps
  {
    onClick: openOnboardPreflightChecksDialog,
  }
)(OnboardPreflightChecksButton);
