import Alarm from '@mui/icons-material/Alarm';
import HelpOutline from '@mui/icons-material/HelpOutline';
import SettingsRemote from '@mui/icons-material/SettingsRemote';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ClockDisplayLabel from '~/components/ClockDisplayLabel';
import { StartMethod } from '~/features/show/enums';
import {
  getShowStartMethod,
  hasScheduledStartTime,
} from '~/features/show/selectors';
import { tt, type PreparedI18nKey } from '~/i18n';
import type { RootState } from '~/store/reducers';

type Props = {
  hasScheduledStartTime: boolean;
  startMethod: StartMethod;
};

const primaryTextForStartMethod: Record<StartMethod, PreparedI18nKey> = {
  [StartMethod.RC]: tt('show.startMethod.RC'),
  [StartMethod.AUTO]: tt('show.startMethod.AUTO'),
};

const iconForStartMethod: Record<StartMethod, React.ReactNode> = {
  [StartMethod.RC]: <SettingsRemote />,
  [StartMethod.AUTO]: <Alarm />,
};

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const StartMethodExplanation = ({
  hasScheduledStartTime,
  startMethod,
}: Props) => {
  const { t } = useTranslation();

  return (
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
                {t('show.clock')} <ClockDisplayLabel clockId='show' />
              </>
            ) : (
              t('show.startTimeNotSet')
            )
          }
        />
      </ListItem>
    </List>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    hasScheduledStartTime: hasScheduledStartTime(state),
    startMethod: getShowStartMethod(state),
  }),
  // mapDispatchToProps
  {}
)(StartMethodExplanation);
