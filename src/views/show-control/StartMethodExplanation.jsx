import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import Alarm from '@material-ui/icons/Alarm';
import HelpOutline from '@material-ui/icons/HelpOutline';
import SettingsRemote from '@material-ui/icons/SettingsRemote';

import ClockDisplayLabel from '~/components/ClockDisplayLabel';
import { StartMethod } from '~/features/show/enums';
import {
  getShowStartMethod,
  hasScheduledStartTime,
} from '~/features/show/selectors';

const primaryTextForStartMethod = {
  [StartMethod.RC]: 'Use the switch on your RC to start',
  [StartMethod.AUTO]: 'Show will start automatically',
};

const iconForStartMethod = {
  [StartMethod.RC]: <SettingsRemote />,
  [StartMethod.AUTO]: <Alarm />,
};

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const StartMethodExplanation = ({ hasScheduledStartTime, startMethod }) => (
  <List dense>
    <ListItem>
      <ListItemIcon>
        {iconForStartMethod[startMethod] || <HelpOutline />}
      </ListItemIcon>
      <ListItemText
        primary={
          primaryTextForStartMethod[startMethod] ||
          'This show uses an unknown start mode'
        }
        secondary={
          hasScheduledStartTime ? (
            <>
              Show clock: <ClockDisplayLabel clockId='show' />
            </>
          ) : (
            'Start time not set yet'
          )
        }
      />
    </ListItem>
  </List>
);

StartMethodExplanation.propTypes = {
  hasScheduledStartTime: PropTypes.bool,
  startMethod: PropTypes.oneOf(StartMethod._VALUES),
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasScheduledStartTime: hasScheduledStartTime(state),
    startMethod: getShowStartMethod(state),
  }),
  // mapDispatchToProps
  {}
)(StartMethodExplanation);
