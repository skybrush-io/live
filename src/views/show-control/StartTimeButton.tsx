import Clear from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight, Tooltip } from '@skybrush/mui-components';

import type { Status } from '~/components/semantics';
import { clearStartTime } from '~/features/show/actions';
import { getShowStartTimeAsString } from '~/features/show/selectors';
import { openStartTimeDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import type { RootState } from '~/store/reducers';

type Props = {
  formattedStartTime?: string;
  onClear?: () => void;
  status: Status;
} & ListItemButtonProps;

/**
 * Component with a button that shows a dialog that allows the user to set up
 * the preferred start time of the show.
 */
const StartTimeButton = ({
  formattedStartTime,
  onClear,
  status,
  ...rest
}: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding>
      <ListItemButton {...rest}>
        <StatusLight status={status} />
        <ListItemText
          primary={t('show.chooseStartTime')}
          secondary={
            formattedStartTime
              ? t('show.startsAt', { time: formattedStartTime })
              : t('show.chooseStartTimeNotSet')
          }
        />
        {formattedStartTime && onClear ? (
          <Tooltip content={t('show.clearStartTime')} placement='left'>
            <span>
              <IconButton
                edge='end'
                size='large'
                onClick={(evt) => {
                  evt.stopPropagation();
                  onClear();
                }}
              >
                <Clear />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </ListItemButton>
    </ListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    formattedStartTime: getShowStartTimeAsString(state),
    status: getSetupStageStatuses(state).setupStartTime,
  }),
  // mapDispatchToProps
  {
    onClick: openStartTimeDialog,
    onClear: clearStartTime,
  }
)(StartTimeButton);
