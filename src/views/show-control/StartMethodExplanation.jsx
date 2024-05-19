import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
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
  [StartMethod.RC]: 'show.startMethod.RC',
  [StartMethod.AUTO]: 'show.startMethod.AUTO',
};

const iconForStartMethod = {
  [StartMethod.RC]: <SettingsRemote />,
  [StartMethod.AUTO]: <Alarm />,
};

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const StartMethodExplanation = ({ hasScheduledStartTime, startMethod, t }) => (
  <List dense>
    <ListItem>
      <ListItemIcon>
        {iconForStartMethod[startMethod] || <HelpOutline />}
      </ListItemIcon>
      <ListItemText
        primary={
          t(primaryTextForStartMethod[startMethod]) ||
          t('show.unknownStartMode')
        }
        secondary={
          hasScheduledStartTime ? (
            <>
              {t('show.clock', 'Show clock:')}{' '}
              <ClockDisplayLabel clockId='show' />
            </>
          ) : (
            t('show.startTimeNotSet')
          )
        }
      />
    </ListItem>
  </List>
);

StartMethodExplanation.propTypes = {
  hasScheduledStartTime: PropTypes.bool,
  startMethod: PropTypes.oneOf(Object.values(StartMethod)),
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasScheduledStartTime: hasScheduledStartTime(state),
    startMethod: getShowStartMethod(state),
  }),
  // mapDispatchToProps
  {}
)(withTranslation()(StartMethodExplanation));
