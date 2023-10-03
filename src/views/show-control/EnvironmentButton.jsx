import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import i18n from '~/i18n';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { AltitudeReference } from '~/features/show/constants';
import {
  getOutdoorShowAltitudeReference,
  getShowEnvironmentType,
} from '~/features/show/selectors';
import { openEnvironmentEditorDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getDisplayLanguage } from '~/features/settings/selectors';

/**
 * Specialized selector to format the secondary text on the button.
 */
const getEnvironmentDescription = createSelector(
  getShowEnvironmentType,
  getOutdoorShowAltitudeReference,
  getDisplayLanguage,
  (environmentType, outdoorAltitudeReference, language) => {
    switch (environmentType) {
      case 'indoor':
        return i18n.t('show.indoor', { lng: language });

      case 'outdoor': {
        const { type, value } = outdoorAltitudeReference;
        if (type === AltitudeReference.AMSL) {
          if (Number.isFinite(value)) {
            return i18n.t('show.outdoor.relativeToAMSL', {
              altitude: value.toFixed(1),
              lng: language,
            });
          } else {
            return 'Outdoor, invalid altitude reference';
          }
        } else if (type === AltitudeReference.AHL) {
          // value should be ignored in this case
          return i18n.t('show.outdoor.relativeToHome');
        } else {
          return 'Outdoor, unknown altitude reference';
        }
      }

      default:
        return 'Unknown';
    }
  }
);

/**
 * Component that shows a button that allows the user to change the type of the
 * show environment and to customize the origin of the show (for outdoor shows)
 * or the size of the stage (for indoor shows).
 */
const EnvironmentButton = ({
  onEditEnvironment,
  secondaryText,
  status,
  t,
  ...rest
}) => (
  <ListItem
    button
    disabled={status === Status.OFF}
    onClick={onEditEnvironment}
    {...rest}
  >
    <StatusLight status={status} />
    <ListItemText
      primary={t('show.setupEnvironment')}
      secondary={secondaryText}
    />
  </ListItem>
);

EnvironmentButton.propTypes = {
  onEditEnvironment: PropTypes.func,
  secondaryText: PropTypes.string,
  status: PropTypes.oneOf(Object.values(Status)),
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    status: getSetupStageStatuses(state).setupEnvironment,
    secondaryText: getEnvironmentDescription(state),
  }),
  // mapDispatchToProps
  {
    onEditEnvironment: openEnvironmentEditorDialog,
  }
)(withTranslation()(EnvironmentButton));
