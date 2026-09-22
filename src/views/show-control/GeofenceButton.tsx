import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { SafetyDialogTab } from '~/features/safety/constants';
import { openSafetyDialog, setSafetyDialogTab } from '~/features/safety/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { type PreparedI18nKey, tt } from '~/i18n';
import type { AppDispatch, RootState } from '~/store/reducers';

const formatStatusText = (status: Status): PreparedI18nKey => {
  switch (status) {
    case Status.OFF:
    case Status.NEXT:
      return tt('geofence.statusText.no');

    case Status.SUCCESS:
      return tt('geofence.statusText.automatic');

    case Status.WARNING:
      return tt('geofence.statusText.manual');

    case Status.ERROR:
      return tt('geofence.statusText.error');

    default:
      return () => '';
  }
};

type Props = {
  status: Status;
} & ListItemButtonProps;

/**
 * Component with a button that shows a dialog that allows the user to create an
 * automatic geofence for the loaded show. The dialog also allows the user to
 * set parameters for the generation such as safety margin width and polygon
 * simplification.
 */
const GeofenceButton = ({ status, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding>
      <ListItemButton disabled={status === Status.OFF} {...rest}>
        <StatusLight status={status} />
        <ListItemText
          primary={t('show.setupGeofence')}
          secondary={formatStatusText(status)(t)}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    status: getSetupStageStatuses(state).setupGeofence,
  }),
  // mapDispatchToProps
  {
    onClick: () => (dispatch: AppDispatch) => {
      dispatch(setSafetyDialogTab(SafetyDialogTab.GEOFENCE));
      dispatch(openSafetyDialog());
    },
  }
)(GeofenceButton);
