import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import type { Status } from '~/components/semantics';
import { getBase64ShowBlob } from '~/features/show/selectors';
import { getSetupStageStatuses } from '~/features/show/stages';
import {
  selectPartialSiteSurveyDataFromShow,
  selectSiteSurveyDataFromShow,
} from '~/features/site-survey/selectors';
import { type ShowData, showDialog } from '~/features/site-survey/state';
import Pro from '~/icons/Pro';
import type { RootState } from '~/store/reducers';

type Props = Readonly<{
  base64Blob?: string;
  show: ShowData | undefined;
  partialShow: Partial<ShowData>;
  showDialog: (data?: ShowData) => void;
  status: Status;
}>;

const SiteSurveyButton = (props: Props): JSX.Element => {
  const { base64Blob, partialShow, show, showDialog, status } = props;
  const { t } = useTranslation();

  const openWithShow = useCallback(() => {
    if (show) {
      showDialog(show);
    }
  }, [show, showDialog]);

  const listItem = (
    <ListItem
      button
      disabled={show === undefined || base64Blob === undefined}
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
  if (show !== undefined) {
    return listItem;
  }

  const tooltipLines: string[] = [];
  if (partialShow.swarm === undefined) {
    tooltipLines.push(t('show.siteSurvey.error.swarmRequired'));
  } else if (base64Blob === undefined) {
    // Only show if there's a loaded show.
    tooltipLines.push(t('show.siteSurvey.error.showNotInMemory'));
  }

  if (partialShow.coordinateSystem === undefined) {
    tooltipLines.push(t('show.siteSurvey.error.outdoorShowAndOriginRequired'));
  }

  // Join and then split to try to handle multiline strings
  // even in a single error description.
  const tooltipContent = tooltipLines
    .join('\n')
    .split('\n')
    // eslint-disable-next-line react/no-array-index-key
    .map((line, idx) => <div key={idx}>{line}</div>);

  return (
    <Tooltip content={tooltipContent}>
      {/* We need a wrapper div because tooltips are not shown on disabled elements. */}
      <div>{listItem}</div>
    </Tooltip>
  );
};

const ConnectedSiteSurveyButton = connect(
  (state: RootState) => ({
    partialShow: selectPartialSiteSurveyDataFromShow(state),
    show: selectSiteSurveyDataFromShow(state),
    base64Blob: getBase64ShowBlob(state),
    status: getSetupStageStatuses(state).siteSurvey,
  }),
  {
    showDialog,
  }
)(SiteSurveyButton);

export default ConnectedSiteSurveyButton;
