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
  getShowStartTime,
} from '~/features/show/selectors';

const primaryTextForStartMethod = {
  [StartMethod.RC]: 'Use the switch on your RC to start',
  [StartMethod.AUTO]: 'Show will start automatically',
};

const iconForStartMethod = {
  [StartMethod.RC]: <SettingsRemote />,
  [StartMethod.AUTO]: <Alarm />,
};

function formatShowStartTime(value, _format, suffix, _then, nextFormatter) {
  if (value === 0) {
    return 'Start time is now';
  } else if (suffix === 'ago') {
    return 'Start time passed ' + nextFormatter();
  } else {
    return 'Start time is in ' + nextFormatter();
  }
}

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const StartMethodExplanation = ({ startMethod, startTime }) => (
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
          startTime ? (
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
  startMethod: PropTypes.oneOf(StartMethod._VALUES),
};

export default connect(
  // mapStateToProps
  (state) => ({
    startMethod: getShowStartMethod(state),
    startTime: getShowStartTime(state),
  }),
  // mapDispatchToProps
  {}
)(StartMethodExplanation);
