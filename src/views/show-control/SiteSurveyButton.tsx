import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

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
import { type PreparedI18nKey, tt } from '~/i18n';
import Pro from '~/icons/Pro';
import { type AppSelector, type RootState } from '~/store/reducers';

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
  const { t } = useTranslation();

  const evaluatedPrerequisites = PREREQUISITES.map(({ selector, message }) => ({
    // NOTE: The `PREREQUISITES` list being readonly and frozen ensures that the
    //       `useSelector` hook will always be called the same number of times.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    result: useSelector(selector),
    message: message(t),
  }));

  const openWithShow = useCallback(() => {
    if (show) {
      showDialog(show);
    }
  }, [show, showDialog]);

  const listItem = (
    <ListItem
      button
      disabled={
        status === Status.OFF ||
        evaluatedPrerequisites.some(({ result }) => !result)
      }
      onClick={openWithShow}
    >
      <StatusLight status={status} />
      <ListItemText
        primary={
          <>
            {t('show.siteSurvey.button')}
            <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
          </>
        }
        secondary={t('show.siteSurvey.description')}
      />
    </ListItem>
  );

  const tooltipContent = (
    <List dense disablePadding style={{ background: 'unset' }}>
      {evaluatedPrerequisites.map(({ result, message }, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <ListItem key={idx}>
          <StatusLight status={result ? Status.SUCCESS : Status.ERROR} />
          <ListItemText primary={message} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Tooltip maxWidth={500} content={tooltipContent} placement='left'>
      {/* NOTE: A wrapper is needed to show tooltips on disabled elements. */}
      <div>{listItem}</div>
    </Tooltip>
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
