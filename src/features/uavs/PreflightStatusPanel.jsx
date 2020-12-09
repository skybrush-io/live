import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useAsyncRetry } from 'react-use';

import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Error from '@material-ui/icons/Error';

import Header from '~/components/dialogs/FormHeader';
import BackgroundHint from '~/components/BackgroundHint';
import LargeProgressIndicator from '~/components/LargeProgressIndicator';
import StatusLight from '~/components/StatusLight';
import useMessageHub from '~/hooks/useMessageHub';
import {
  describeOverallPreflightCheckResult,
  describePreflightCheckResult,
  getSemanticsForPreflightCheckResult,
  PreflightCheckResult,
} from '~/model/enums';
import CustomPropTypes from '~/utils/prop-types';

const PreflightStatusResults = ({ message, result, items }) => {
  return (
    <>
      <List dense>
        <ListItem>
          <StatusLight status={getSemanticsForPreflightCheckResult(result)} />
          <ListItemText
            primary={describeOverallPreflightCheckResult(result)}
            secondary={message}
          />
        </ListItem>
      </List>
      {items && items.length > 0 ? (
        <>
          <Divider />
          <Header ml={2}>Details</Header>
          <List dense>
            {items.map((item) => (
              <ListItem key={item.id}>
                <StatusLight
                  status={getSemanticsForPreflightCheckResult(item.result)}
                />
                <ListItemText
                  primary={
                    message ||
                    (item.result === PreflightCheckResult.PASS
                      ? item.label
                      : `${item.label} — ${describePreflightCheckResult(
                          item.result
                        )}`)
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      ) : null}
    </>
  );
};

PreflightStatusResults.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      message: PropTypes.string,
      result: CustomPropTypes.preflightCheckResult,
    })
  ),
  message: PropTypes.string,
  result: CustomPropTypes.preflightCheckResult,
};

const PreflightStatusPanel = ({ uavId }) => {
  const messageHub = useMessageHub();
  const state = useAsyncRetry(
    () => (uavId ? messageHub.query.getPreflightStatus(uavId) : {}),
    [messageHub, uavId]
  );

  // Refresh the status every second
  useEffect(() => {
    const isResultReady =
      uavId && !state.loading && !state.error && state.value;
    let timeoutId;

    if (isResultReady) {
      timeoutId = setTimeout(() => {
        state.retry();
      }, 1000);
    }

    return timeoutId !== undefined ? () => clearTimeout(timeoutId) : undefined;
  }, [state, uavId]);

  if (state.error && !state.loading) {
    return (
      <BackgroundHint
        icon={<Error />}
        text='Error while loading preflight status report'
        button={<Button onClick={state.retry}>Try again</Button>}
      />
    );
  }

  if (state.value) {
    return (
      <PreflightStatusResults
        result={state.value.result}
        items={state.value.items}
      />
    );
  }

  if (state.loading) {
    return (
      <LargeProgressIndicator fullHeight label='Retrieving status report...' />
    );
  }

  return (
    <BackgroundHint
      text='Preflight status report not loaded yet'
      button={<Button onClick={state.retry}>Try again</Button>}
    />
  );
};

PreflightStatusPanel.propTypes = {
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  {}
)(PreflightStatusPanel);
