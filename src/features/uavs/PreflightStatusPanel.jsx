import PropTypes from 'prop-types';
import React, { memo, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useAsyncRetry, useUnmount } from 'react-use';

import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Error from '@material-ui/icons/Error';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import Header from '@skybrush/mui-components/lib/FormHeader';
import LargeProgressIndicator from '@skybrush/mui-components/lib/LargeProgressIndicator';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { errorCodeToSemantics } from '~/flockwave/errors';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import useMessageHub from '~/hooks/useMessageHub';
import {
  describeOverallPreflightCheckResult,
  describePreflightCheckResult,
  getSemanticsForPreflightCheckResult,
  PreflightCheckResult,
} from '~/model/enums';
import CustomPropTypes from '~/utils/prop-types';

import { getUAVById } from './selectors';

const ErrorList = ({ errorCodes }) => {
  const relevantErrorCodes = (errorCodes || []).filter(
    (code) =>
      code !== UAVErrorCode.PREARM_CHECK_IN_PROGRESS &&
      code !== UAVErrorCode.PREARM_CHECK_FAILURE
  );
  if (relevantErrorCodes.length === 0) {
    return null;
  }

  return (
    <>
      <List dense>
        {relevantErrorCodes.map((code) => (
          <ListItem key={code}>
            <StatusLight status={errorCodeToSemantics(code)} />
            <ListItemText primary={UAVErrorCode.describe(code)} />
          </ListItem>
        ))}
      </List>
      <Divider />
    </>
  );
};

ErrorList.propTypes = {
  errorCodes: PropTypes.arrayOf(PropTypes.number),
};

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

const PreflightStatusPanelLowerSegment = memo(({ uavId }) => {
  const messageHub = useMessageHub();
  const state = useAsyncRetry(
    () => (uavId ? messageHub.query.getPreflightStatus(uavId) : {}),
    [messageHub, uavId]
  );
  const scheduledRefresh = useRef();

  // Refresh the status every second
  useEffect(() => {
    const isResultReady =
      uavId && !state.loading && !state.error && Boolean(state.value);
    if (isResultReady && !scheduledRefresh.current) {
      scheduledRefresh.current = setTimeout(() => {
        scheduledRefresh.current = undefined;
        state.retry();
      }, 1000);
    }
  }, [state, uavId]);

  // Cancel scheduled refreshes when unmounting
  useUnmount(() => {
    if (scheduledRefresh.current) {
      clearTimeout(scheduledRefresh.current);
    }
  });

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
        message={state.value.message}
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
});

PreflightStatusPanelLowerSegment.propTypes = {
  uavId: PropTypes.string,
};

const PreflightStatusPanel = ({ errorCodes, uavId }) => (
  <>
    <ErrorList errorCodes={errorCodes} />
    <PreflightStatusPanelLowerSegment uavId={uavId} />
  </>
);

PreflightStatusPanel.propTypes = {
  errorCodes: PropTypes.arrayOf(PropTypes.number),
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    errorCodes: ownProps.uavId
      ? getUAVById(state, ownProps.uavId)?.errors
      : null,
  }),
  // mapDispatchToProps
  {}
)(PreflightStatusPanel);
