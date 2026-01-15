import Home from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';

import {
  MiniList,
  MiniListItem,
  StatusLight,
  Tooltip,
} from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { showDialog as showCollectiveRTHDialog } from '~/features/collective-rth/state';
import {
  isConnected,
  supportsStudioInterop,
} from '~/features/servers/selectors';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import { showDialogAndClearUndoHistory } from '~/features/show-configurator/actions';
import { selectShowConfiguratorDataFromShow } from '~/features/show-configurator/selectors';
import { type ShowData } from '~/features/show-configurator/state';
import {
  getEnvironmentFromLoadedShowData,
  getOutdoorShowOrigin,
  getShowSegments,
  hasLoadedShowFile,
  selectCollectiveRTHPlanSummary,
  type CollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import { getSetupStageStatuses } from '~/features/show/stages';
import { showError } from '~/features/snackbar/actions';
import { tt, type PreparedI18nKey } from '~/i18n';
import Pro from '~/icons/Pro';
import type { AppDispatch, AppSelector, RootState } from '~/store/reducers';
import { type Nullable } from '~/utils/types';

const PREREQUISITES: ReadonlyArray<
  Readonly<{
    selector: AppSelector<boolean>;
    message: PreparedI18nKey;
  }>
> = Object.freeze([
  {
    selector: hasLoadedShowFile,
    message: tt('show.showConfigurator.prerequisites.loaded'),
  },
  {
    selector: (state: RootState) => getShowSegments(state)?.show !== undefined,
    message: tt('show.showConfigurator.prerequisites.segments'),
  },
  {
    selector: isConnected,
    message: tt('show.showConfigurator.prerequisites.server'),
  },
  {
    selector: supportsStudioInterop,
    message: tt('show.showConfigurator.prerequisites.extension'),
  },
  {
    selector: (state: RootState) =>
      [
        getOutdoorShowOrigin(state),
        getEnvironmentFromLoadedShowData(state)?.location?.origin,
      ].some((v) => v !== undefined),
    message: tt('show.showConfigurator.prerequisites.origin'),
  },
]);

type Props = Readonly<{
  base64Blob?: string;
  devModeEnabled: boolean;
  show: ShowData | undefined;
  partialShow: Partial<ShowData>;
  // TODO: This should probably be a `ThunkActionDispatch`, but that doesn't
  //       seem to be reexported from `redux-thunk` via `@reduxjs/toolkit`...
  showDialogAndClearUndoHistory: (data?: ShowData) => void;
  showCollectiveRTHDialog: () => void;
  status: Status;
  rthPlanSummary: CollectiveRTHPlanSummary;
}>;

const ShowConfiguratorButton = (props: Props): React.JSX.Element => {
  const {
    devModeEnabled,
    show,
    showDialogAndClearUndoHistory,
    showCollectiveRTHDialog,
    status,
    rthPlanSummary,
  } = props;

  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  // NOTE: Using a `ref` here broke when rearranging the GolenLayout panels...
  //       (The popup wouldn't show up until something triggered a rerender.)
  const [tooltipTriggerTarget, setTooltipTriggerTarget] =
    useState<Nullable<HTMLDivElement>>();

  const evaluatedPrerequisites = PREREQUISITES.map(({ selector, message }) => ({
    // NOTE: The `PREREQUISITES` list being readonly and frozen ensures that the
    //       `useSelector` hook will always be called the same number of times.
    result: useSelector(selector),
    message: message(t),
  }));

  const prerequisitesFulfilled = evaluatedPrerequisites.every(
    ({ result }) => result
  );

  const openWithShow = useCallback(() => {
    if (show) {
      showDialogAndClearUndoHistory(show);
    } else {
      dispatch(showError(t('show.showConfigurator.noShowData')));
    }
  }, [dispatch, show, showDialogAndClearUndoHistory, t]);

  const tooltipContent = (
    <MiniList>
      {evaluatedPrerequisites.map(({ result, message }, idx) => (
        <MiniListItem
          key={idx}
          iconPreset={
            result
              ? 'success'
              : 'disconnected' /* TODO: use 'error' when we migrated to mui */
          }
          primaryText={message}
        />
      ))}
    </MiniList>
  );

  const tooltipVisible = status !== Status.OFF && !prerequisitesFulfilled;
  const disabled = status === Status.OFF || !prerequisitesFulfilled;

  return (
    <div ref={setTooltipTriggerTarget}>
      <ListItemButton disabled={disabled} onClick={openWithShow}>
        <StatusLight status={disabled ? Status.OFF : status} />
        <ListItemText
          primary={
            <Tooltip
              content={tooltipContent}
              disabled={!tooltipVisible}
              maxWidth={500}
              placement='left'
              triggerTarget={tooltipTriggerTarget}
            >
              <span>
                {t('show.showConfigurator.button')}
                <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
              </span>
            </Tooltip>
          }
          secondary={t('show.showConfigurator.description')}
        />
        {devModeEnabled && (
          <Tooltip
            content={
              rthPlanSummary.isValid
                ? t('show.showConfigurator.tooltip.validRTHPlan', {
                    numPlans: Object.keys(rthPlanSummary.plans).length,
                  })
                : t('show.showConfigurator.tooltip.invalidRTHPlan')
            }
            placement='left'
          >
            <IconButton
              edge='end'
              size='large'
              color={
                rthPlanSummary.numDrones === 0
                  ? 'default'
                  : rthPlanSummary.isValid
                    ? 'success'
                    : 'warning'
              }
              onClick={(evt) => {
                evt.stopPropagation();
                showCollectiveRTHDialog();
              }}
            >
              <Home />
            </IconButton>
          </Tooltip>
        )}
      </ListItemButton>
    </div>
  );
};

const ConnectedShowConfiguratorButton = connect(
  (state: RootState) => ({
    show: selectShowConfiguratorDataFromShow(state),
    status: getSetupStageStatuses(state).showConfigurator,
    rthPlanSummary: selectCollectiveRTHPlanSummary(state),
    devModeEnabled: isDeveloperModeEnabled(state),
  }),
  {
    showDialogAndClearUndoHistory,
    showCollectiveRTHDialog,
  }
)(ShowConfiguratorButton);

export default ConnectedShowConfiguratorButton;
