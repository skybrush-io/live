import Error from '@mui/icons-material/Error';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAsyncRetry, useUnmount } from 'react-use';

import type { UAVPreflightCheckInfo } from '@skybrush/flockwave-spec';
import {
  BackgroundHint,
  FormHeader as Header,
  LargeProgressIndicator,
  StatusLight,
} from '@skybrush/mui-components';

import { errorCodeToSemantics } from '~/flockwave/errors';
import UAVErrorCode, { describeUAVErrorCode } from '~/flockwave/UAVErrorCode';
import useMessageHub from '~/hooks/useMessageHub';
import {
  describeOverallPreflightCheckResult,
  describePreflightCheckResult,
  getSemanticsForPreflightCheckResult,
} from '~/model/enums';
import type { RootState } from '~/store/reducers';

import { getUAVById } from './selectors';

type ErrorListProps = {
  errorCodes?: UAVErrorCode[];
};

const ErrorList = ({ errorCodes }: ErrorListProps) => {
  const { t } = useTranslation();
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
            <ListItemText primary={describeUAVErrorCode(code, t)} />
          </ListItem>
        ))}
      </List>
      <Divider />
    </>
  );
};

type PreflightStatusResultsProps = UAVPreflightCheckInfo;

const PreflightStatusResults = ({
  items,
  message,
  result,
}: PreflightStatusResultsProps) => {
  const { t } = useTranslation();
  return (
    <>
      <List dense>
        <ListItem>
          <StatusLight status={getSemanticsForPreflightCheckResult(result)} />
          <ListItemText
            primary={describeOverallPreflightCheckResult(result, t)}
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
                    (item.result === 'pass'
                      ? item.label
                      : `${item.label} — ${describePreflightCheckResult(
                          item.result,
                          t
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

type PreflightStatusPanelLowerSegmentProps = {
  uavId?: string;
};

const missingUAVCheckInfo: UAVPreflightCheckInfo = {
  items: [],
  result: 'off',
};

const PreflightStatusPanelLowerSegment = memo(
  ({ uavId }: PreflightStatusPanelLowerSegmentProps) => {
    const messageHub = useMessageHub();
    const state = useAsyncRetry(
      () =>
        uavId
          ? messageHub.query.getPreflightStatus(uavId)
          : Promise.resolve(missingUAVCheckInfo),
      [messageHub, uavId]
    );
    const scheduledRefresh = useRef<ReturnType<typeof setTimeout>>();

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
        <LargeProgressIndicator
          fullHeight
          label='Retrieving status report...'
        />
      );
    }

    return (
      <BackgroundHint
        text='Preflight status report not loaded yet'
        button={<Button onClick={state.retry}>Try again</Button>}
      />
    );
  }
);

PreflightStatusPanelLowerSegment.displayName =
  'PreflightStatusPanelLowerSegment';

type PreflightStatusPanelOwnProps = {
  uavId?: string;
};
type PreflightStatusPanelDiospatchProps = {
  errorCodes?: UAVErrorCode[];
};
type PreflightStatusPanelProps = PreflightStatusPanelOwnProps &
  PreflightStatusPanelDiospatchProps;

const PreflightStatusPanel = ({
  errorCodes,
  uavId,
}: PreflightStatusPanelProps) => (
  <>
    <ErrorList errorCodes={errorCodes} />
    <PreflightStatusPanelLowerSegment uavId={uavId} />
  </>
);

export default connect(
  // mapStateToProps
  (state: RootState, ownProps: PreflightStatusPanelOwnProps) => ({
    errorCodes: ownProps.uavId
      ? getUAVById(state, ownProps.uavId)?.errors
      : undefined,
  })
)(PreflightStatusPanel);
