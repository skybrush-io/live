import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight, Tooltip } from '@skybrush/mui-components';

import PrerequisiteList from '~/components/PrerequisiteList';
import { Status } from '~/components/semantics';
import { showDialog as showCollectiveRTHDialog } from '~/features/collective-rth/slice';
import {
  isConnected,
  supportsStudioInterop,
} from '~/features/servers/selectors';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import { showDialogAndClearUndoHistory } from '~/features/show-configurator/actions';
import { selectShowConfiguratorDataFromShow } from '~/features/show-configurator/selectors';
import { type ShowData } from '~/features/show-configurator/slice';
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
import {
  useConstPrerequisites,
  type Prerequisite,
} from '~/hooks/useConstPrerequisites';
import { tt } from '~/i18n';
import HomeCircleOutlined from '~/icons/HomeCircleOutlined';
import Pro from '~/icons/Pro';
import type { RootState } from '~/store/reducers';
import { type Nullable } from '~/utils/types';

const PREREQUISITES: readonly Prerequisite[] = Object.freeze([
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
  partialShow: Partial<ShowData>;
  rthPlanSummary: CollectiveRTHPlanSummary;
  show: ShowData | undefined;
  showCollectiveRTHDialog: () => void;
  // TODO: This should probably be a `ThunkActionDispatch`, but that doesn't
  //       seem to be reexported from `redux-thunk` via `@reduxjs/toolkit`...
  showDialogAndClearUndoHistory: (data?: ShowData) => void;
  status: Status;
}>;

const ShowConfiguratorButton = (props: Props) => {
  const {
    devModeEnabled,
    rthPlanSummary,
    show,
    showCollectiveRTHDialog,
    showDialogAndClearUndoHistory,
    status,
  } = props;

  const { t } = useTranslation();

  // NOTE: Using a `ref` here broke when rearranging the GolenLayout panels...
  //       (The popup wouldn't show up until something triggered a rerender.)
  const [tooltipTriggerTarget, setTooltipTriggerTarget] =
    useState<Nullable<HTMLElement>>();

  const { prerequisites, prerequisitesFulfilled } =
    useConstPrerequisites(PREREQUISITES);

  const openWithShow = useCallback(() => {
    if (show) {
      showDialogAndClearUndoHistory(show);
    } else {
      showError(t('show.showConfigurator.noShowData'));
    }
  }, [show, showDialogAndClearUndoHistory, t]);

  const tooltipVisible = status !== Status.OFF && !prerequisitesFulfilled;
  const disabled = status === Status.OFF || !prerequisitesFulfilled;

  return (
    <ListItem disablePadding ref={setTooltipTriggerTarget}>
      <ListItemButton disabled={disabled} onClick={openWithShow}>
        <StatusLight status={disabled ? Status.OFF : status} />
        <ListItemText
          primary={
            <Tooltip
              content={<PrerequisiteList prerequisites={prerequisites} />}
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
              <HomeCircleOutlined />
            </IconButton>
          </Tooltip>
        )}
      </ListItemButton>
    </ListItem>
  );
};

const ConnectedShowConfiguratorButton = connect(
  (state: RootState) => ({
    devModeEnabled: isDeveloperModeEnabled(state),
    rthPlanSummary: selectCollectiveRTHPlanSummary(state),
    show: selectShowConfiguratorDataFromShow(state),
    status: getSetupStageStatuses(state).showConfigurator,
  }),
  {
    showCollectiveRTHDialog,
    showDialogAndClearUndoHistory,
  }
)(ShowConfiguratorButton);

export default ConnectedShowConfiguratorButton;
