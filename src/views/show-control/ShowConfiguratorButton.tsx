import BlurCircular from '@mui/icons-material/BlurCircular';
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
import { areExperimentalFeaturesEnabled } from '~/features/settings/selectors';
import { showDialogAndClearUndoHistory as showAdaptDialogAndClearUndoHistory } from '~/features/show-configurator/actions';
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
import Pro from '~/icons/Pro';
import type { RootState } from '~/store/reducers';
import { type Nullable } from '~/utils/types';

const hasShowSegment = (state: RootState) =>
  getShowSegments(state)?.show !== undefined;

const PREREQUISITES: readonly Prerequisite[] = Object.freeze([
  {
    id: 'hasLoadedShowFile',
    selector: hasLoadedShowFile,
    message: tt('show.showConfigurator.prerequisites.loaded'),
  },
  {
    id: 'isConnected',
    selector: isConnected,
    message: tt('show.showConfigurator.prerequisites.server'),
  },
  {
    id: 'hasSegments',
    selector: hasShowSegment,
    message: tt('show.showConfigurator.prerequisites.segments'),
    skipIf: areExperimentalFeaturesEnabled,
  },
  {
    id: 'hasOrigin',
    selector: (state: RootState) =>
      [
        getOutdoorShowOrigin(state),
        getEnvironmentFromLoadedShowData(state)?.location?.origin,
      ].some((v) => v !== undefined),
    message: tt('show.showConfigurator.prerequisites.origin'),
  },
  {
    id: 'supportsStudioInterop',
    selector: supportsStudioInterop,
    message: tt('show.showConfigurator.prerequisites.extension'),
  },
]);

type StateProps = {
  experimentalFeaturesEnabled: boolean;
  rthPlanSummary: CollectiveRTHPlanSummary;
  show: ShowData | undefined;
  showHasSegments: boolean;
  status: Status;
};

type DispatchProps = {
  showAdaptDialogAndClearUndoHistory: (data?: ShowData) => void;
  showCollectiveRTHDialog: () => void;
};

type Props = StateProps & DispatchProps;

const ShowConfiguratorButton = ({
  experimentalFeaturesEnabled,
  rthPlanSummary,
  show,
  showAdaptDialogAndClearUndoHistory,
  showCollectiveRTHDialog,
  showHasSegments,
  status,
}: Props) => {
  const { t } = useTranslation();

  // NOTE: Using a `ref` here broke when rearranging the GolenLayout panels...
  //       (The popup wouldn't show up until something triggered a rerender.)
  const [tooltipTriggerTarget, setTooltipTriggerTarget] =
    useState<Nullable<HTMLElement>>();

  const { prerequisites, prerequisitesFulfilled } =
    useConstPrerequisites(PREREQUISITES);

  const openAdaptDialog = useCallback(() => {
    if (show) {
      showAdaptDialogAndClearUndoHistory(show);
    } else {
      showError(t('show.showConfigurator.noShowData'));
    }
  }, [show, showAdaptDialogAndClearUndoHistory, t]);

  const crthEnabled = experimentalFeaturesEnabled;
  const tooltipVisible = status !== Status.OFF && !prerequisitesFulfilled;
  const disabled = status === Status.OFF || !prerequisitesFulfilled;

  const primaryAction = crthEnabled
    ? () => {
        showCollectiveRTHDialog();
      }
    : () => {
        openAdaptDialog();
      };

  return (
    <ListItem disablePadding ref={setTooltipTriggerTarget}>
      <ListItemButton disabled={disabled} onClick={primaryAction}>
        <StatusLight
          status={
            disabled
              ? Status.OFF
              : rthPlanSummary.isValid || !crthEnabled
                ? Status.SUCCESS
                : Status.WARNING
          }
        />
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
                {crthEnabled
                  ? t('show.showConfigurator.button')
                  : t('show.showConfiguratorLegacy.button')}
                <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
              </span>
            </Tooltip>
          }
          secondary={
            crthEnabled
              ? t('show.showConfigurator.description')
              : t('show.showConfiguratorLegacy.description')
          }
        />
        {crthEnabled && (
          <Tooltip
            content={t(
              showHasSegments
                ? 'show.showConfigurator.tooltip.adaptShow'
                : 'show.showConfigurator.tooltip.showSegmentsRequired'
            )}
            placement='left'
          >
            <span>
              <IconButton
                disabled={!showHasSegments}
                edge='end'
                size='large'
                onClick={(evt) => {
                  evt.stopPropagation();
                  openAdaptDialog();
                }}
              >
                <BlurCircular />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </ListItemButton>
    </ListItem>
  );
};

const ConnectedShowConfiguratorButton = connect(
  (state: RootState) => ({
    experimentalFeaturesEnabled: areExperimentalFeaturesEnabled(state),
    rthPlanSummary: selectCollectiveRTHPlanSummary(state),
    show: selectShowConfiguratorDataFromShow(state),
    showHasSegments: hasShowSegment(state),
    status: getSetupStageStatuses(state).collectiveRTH,
  }),
  {
    showCollectiveRTHDialog,
    showAdaptDialogAndClearUndoHistory,
  }
)(ShowConfiguratorButton);

export default ConnectedShowConfiguratorButton;
