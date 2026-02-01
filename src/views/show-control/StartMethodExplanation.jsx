import Alarm from '@mui/icons-material/Alarm';
import HelpOutline from '@mui/icons-material/HelpOutline';
import SettingsRemote from '@mui/icons-material/SettingsRemote';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ClockDisplayLabel from '~/components/ClockDisplayLabel';
import { StartMethod } from '~/features/show/enums';
import {
  getShowStartMethod,
  hasScheduledStartTime,
} from '~/features/show/selectors';
import { tt } from '~/i18n';

const primaryTextForStartMethod = {
  [StartMethod.RC]: tt('show.startMethod.RC'),
  [StartMethod.AUTO]: tt('show.startMethod.AUTO'),
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
          primaryTextForStartMethod[startMethod]?.(t) ||
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
