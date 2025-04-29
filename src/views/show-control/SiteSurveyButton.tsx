import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListItem from '@skybrush/mui-components/lib/MiniListItem';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { Status } from '~/components/semantics';
import {
  isConnected,
  supportsStudioInterop,
} from '~/features/servers/selectors';
import {
  getEnvironmentFromLoadedShowData,
  getOutdoorShowOrigin,
  getShowSegments,
  hasLoadedShowFile,
} from '~/features/show/selectors';
import { getSetupStageStatuses } from '~/features/show/stages';
import { selectSiteSurveyDataFromShow } from '~/features/site-survey/selectors';
import { type ShowData, showDialog } from '~/features/site-survey/state';
import { showError } from '~/features/snackbar/actions';
import { type PreparedI18nKey, tt } from '~/i18n';
import Pro from '~/icons/Pro';
import {
  type AppDispatch,
  type AppSelector,
  type RootState,
} from '~/store/reducers';
import { type Nullable } from '~/utils/types';

const PREREQUISITES: ReadonlyArray<
  Readonly<{
    selector: AppSelector<boolean>;
    message: PreparedI18nKey;
  }>
> = Object.freeze([
  {
    selector: hasLoadedShowFile,
    message: tt('show.siteSurvey.prerequisites.loaded'),
  },
  {
    selector: (state: RootState) => getShowSegments(state)?.show !== undefined,
    message: tt('show.siteSurvey.prerequisites.segments'),
  },
  {
    selector: isConnected,
    message: tt('show.siteSurvey.prerequisites.server'),
  },
  {
    selector: supportsStudioInterop,
    message: tt('show.siteSurvey.prerequisites.extension'),
  },
  {
    selector: (state: RootState) =>
      [
        getOutdoorShowOrigin(state),
        getEnvironmentFromLoadedShowData(state)?.location?.origin,
      ].some((v) => v !== undefined),
    message: tt('show.siteSurvey.prerequisites.origin'),
  },
]);

type Props = Readonly<{
  base64Blob?: string;
  show: ShowData | undefined;
  partialShow: Partial<ShowData>;
  showDialog: (data?: ShowData) => void;
  status: Status;
}>;

const SiteSurveyButton = (props: Props): JSX.Element => {
  const { show, showDialog, status } = props;

  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  // NOTE: Using a `ref` here broke when rearranging the GolenLayout panels...
  //       (The popup wouldn't show up until something triggered a rerender.)
  const [tooltipTriggerTarget, setTooltipTriggerTarget] =
    useState<Nullable<HTMLDivElement>>();

  const evaluatedPrerequisites = PREREQUISITES.map(({ selector, message }) => ({
    // NOTE: The `PREREQUISITES` list being readonly and frozen ensures that the
    //       `useSelector` hook will always be called the same number of times.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    result: useSelector(selector),
    message: message(t),
  }));

  const prerequisitesFulfilled = evaluatedPrerequisites.every(
    ({ result }) => result
  );

  const openWithShow = useCallback(() => {
    if (show) {
      showDialog(show);
    } else {
      dispatch(showError(t('show.siteSurvey.noShowData')));
    }
  }, [dispatch, show, showDialog, t]);

  const tooltipContent = (
    <MiniList>
      {evaluatedPrerequisites.map(({ result, message }, idx) => (
        <MiniListItem
          // eslint-disable-next-line react/no-array-index-key
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

  const disabled = status === Status.OFF || !prerequisitesFulfilled;

  return (
    <div ref={setTooltipTriggerTarget}>
      <ListItem button disabled={disabled} onClick={openWithShow}>
        <StatusLight status={disabled ? Status.OFF : status} />
        <ListItemText
          primary={
            <Tooltip
              content={tooltipContent}
              disabled={prerequisitesFulfilled}
              maxWidth={500}
              placement='left'
              triggerTarget={tooltipTriggerTarget}
            >
              <span>
                {t('show.siteSurvey.button')}
                <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
              </span>
            </Tooltip>
          }
          secondary={t('show.siteSurvey.description')}
        />
      </ListItem>
    </div>
  );
};

const ConnectedSiteSurveyButton = connect(
  (state: RootState) => ({
    show: selectSiteSurveyDataFromShow(state),
    status: getSetupStageStatuses(state).siteSurvey,
  }),
  {
    showDialog,
  }
)(SiteSurveyButton);

export default ConnectedSiteSurveyButton;
