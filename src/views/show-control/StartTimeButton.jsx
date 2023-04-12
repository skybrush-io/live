import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { getShowStartTimeAsString } from '~/features/show/selectors';
import { openStartTimeDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to set up
 * the preferred start time of the show.
 */
const StartTimeButton = ({ formattedStartTime, onClick, status }) => {
  const { t } = useTranslation();

  return (
    <ListItem button onClick={onClick}>
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.chooseStartTime')}
        secondary={
          formattedStartTime
            ? t('show.startsAt', { time: formattedStartTime })
            : t('show.chooseStartTimeNotSet', 'Not set yet')
        }
      />
    </ListItem>
  );
};

StartTimeButton.propTypes = {
  formattedStartTime: PropTypes.string,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
};

StartTimeButton.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    formattedStartTime: getShowStartTimeAsString(state),
    status: getSetupStageStatuses(state).setupStartTime,
  }),
  // mapDispatchToProps
  {
    onClick: openStartTimeDialog,
  }
)(StartTimeButton);
