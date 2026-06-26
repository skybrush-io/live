import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { openTakeoffAreaSetupDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';
import { type PreparedI18nKey, tt } from '~/i18n';
import type { RootState } from '~/store/reducers';
import { formatDistance } from '~/utils/formatting';

const formatStatusText = (
  status: Status,
  maxDistance: number | undefined
): PreparedI18nKey => {
  if (typeof maxDistance === 'number') {
    if (Number.isFinite(maxDistance)) {
      return tt('show.placementAccuracy', {
        distance: formatDistance(maxDistance),
      });
    }

    return tt('show.takeOffNoPosition');
  }

  switch (status) {
    case Status.OFF:
    case Status.NEXT:
      return tt('show.takeOffPlace');

    case Status.SUCCESS:
      return tt('show.dronePlacementApproved');

    case Status.ERROR:
      return tt('show.dronePlacementError');

    case Status.SKIPPED:
      return tt('show.dronePlacementPartial');

    case Status.WAITING:
      return tt('show.dronePlacementCheck');

    default:
      return () => '';
  }
};

type Props = {
  maxDistance: number | undefined;
  status: Status;
} & ListItemButtonProps;

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const TakeoffAreaButton = ({ maxDistance, status, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding>
      <ListItemButton disabled={status === Status.OFF} {...rest}>
        <StatusLight status={status} />
        <ListItemText
          primary={t('show.setupTakeoffArea')}
          secondary={formatStatusText(status, maxDistance)(t)}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    // TODO(ntamas): getFarthestDistanceFromHome() is recalculated all the time;
    // we need to fix this
    maxDistance:
      getSetupStageStatuses(state).setupTakeoffArea !== Status.OFF
        ? getFarthestDistanceFromHome(state)
        : undefined,
    status: getSetupStageStatuses(state).setupTakeoffArea,
  }),
  // mapDispatchToProps
  {
    onClick: openTakeoffAreaSetupDialog,
  }
)(TakeoffAreaButton);
