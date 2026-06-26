import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { createSelector } from '@reduxjs/toolkit';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';
import { EnvironmentType } from '@skybrush/show-format';

import { Status } from '~/components/semantics';
import { AltitudeReference } from '~/features/show/constants';
import {
  getOutdoorShowAltitudeReference,
  getShowEnvironmentType,
} from '~/features/show/selectors';
import { openEnvironmentEditorDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { type PreparedI18nKey, tt } from '~/i18n';
import type { RootState } from '~/store/reducers';

/**
 * Specialized selector to format the secondary text on the button.
 */
const getEnvironmentDescription = createSelector(
  getShowEnvironmentType,
  getOutdoorShowAltitudeReference,
  (environmentType, outdoorAltitudeReference): PreparedI18nKey => {
    switch (environmentType) {
      case EnvironmentType.INDOOR:
        return tt('show.indoor');

      case EnvironmentType.OUTDOOR: {
        const { type, value } = outdoorAltitudeReference;
        if (type === AltitudeReference.AMSL) {
          if (Number.isFinite(value)) {
            return tt('show.outdoor.relativeToAMSL', {
              altitude: value.toFixed(1),
            });
          } else {
            return tt('show.outdoor.invalidAltitudeReference');
          }
        } else if (type === AltitudeReference.AHL) {
          // value should be ignored in this case
          return tt('show.outdoor.relativeToHome');
        } else {
          return tt('show.outdoor.unknownAltitudeReference');
        }
      }

      default:
        return tt('show.unknown');
    }
  }
);

type Props = {
  onEditEnvironment: () => void;
  secondaryText: PreparedI18nKey;
  status: Status;
} & ListItemButtonProps;

/**
 * Component that shows a button that allows the user to change the type of the
 * show environment and to customize the origin of the show (for outdoor shows)
 * or the size of the stage (for indoor shows).
 */
const EnvironmentButton = ({
  onEditEnvironment,
  secondaryText,
  status,
  ...rest
}: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding>
      <ListItemButton
        disabled={status === Status.OFF}
        onClick={onEditEnvironment}
        {...rest}
      >
        <StatusLight status={status} />
        <ListItemText
          primary={t('show.setupEnvironment')}
          secondary={secondaryText(t)}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    status: getSetupStageStatuses(state).setupEnvironment,
    secondaryText: getEnvironmentDescription(state),
  }),
  // mapDispatchToProps
  {
    onEditEnvironment: openEnvironmentEditorDialog,
  }
)(EnvironmentButton);
