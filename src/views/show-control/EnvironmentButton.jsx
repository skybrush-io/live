import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { ALTITUDE_REFERENCE } from '~/features/show/constants';
import {
  getOutdoorShowAltitudeReference,
  getShowEnvironmentType,
} from '~/features/show/selectors';
import { openEnvironmentEditorDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Specialized selector to format the secondary text on the button.
 */
const getEnvironmentDescription = createSelector(
  getShowEnvironmentType,
  getOutdoorShowAltitudeReference,
  (environmentType, outdoorAltitudeReference) => {
    switch (environmentType) {
      case 'indoor':
        return 'Indoor';

      case 'outdoor': {
        const { type, value } = outdoorAltitudeReference;
        if (type === ALTITUDE_REFERENCE.AMSL) {
          if (Number.isFinite(value)) {
            return `Outdoor, relative to ${value.toFixed(1)}m AMSL`;
          } else {
            return 'Outdoor, invalid altitude reference';
          }
        } else if (type === ALTITUDE_REFERENCE.AGL) {
          // value should be ignored in this case
          return `Outdoor, relative to ground`;
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
  ...rest
}) => (
  <ListItem
    button
    disabled={status === Status.OFF}
    onClick={onEditEnvironment}
    {...rest}
  >
    <StatusLight status={status} />
    <ListItemText primary='Setup environment' secondary={secondaryText} />
  </ListItem>
);

EnvironmentButton.propTypes = {
  onEditEnvironment: PropTypes.func,
  secondaryText: PropTypes.string,
  status: PropTypes.oneOf(Object.values(Status)),
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
)(EnvironmentButton);
