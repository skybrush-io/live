import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

// @ts-ignore
import StatusLight from '@skybrush/mui-components/lib/StatusLight';
// @ts-ignore
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { Status } from '~/components/semantics';
import { getBase64ShowBlob } from '~/features/show/selectors';
import {
  selectPartialSiteSurveyDataFromShow,
  selectSiteSurveyDataFromShow,
} from '~/features/site-survey/selectors';
import { type ShowData, showDialog } from '~/features/site-survey/state';
import type { RootState } from '~/store/reducers';

type Props = {
  base64Blob?: string;
  show: ShowData | undefined;
  partialShow: Partial<ShowData>;
  showDialog: (data?: ShowData) => void;
};

function SiteSurveyButton(props: Props) {
  const { base64Blob, partialShow, show, showDialog } = props;
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
      <StatusLight status={Status.INFO} />
      <ListItemText
        primary={t('show.siteSurvey.button')}
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

  return (
    <Tooltip content={tooltipLines.join('\n')}>
      {/* We need a wrapper div because tooltips are not shown on disabled elements. */}
      <div>{listItem}</div>
    </Tooltip>
  );
}

const ConnectedSiteSurveyButton = connect(
  (state: RootState) => ({
    partialShow: selectPartialSiteSurveyDataFromShow(state),
    show: selectSiteSurveyDataFromShow(state),
    base64Blob: getBase64ShowBlob(state),
  }),
  {
    showDialog,
  }
)(SiteSurveyButton);

export default ConnectedSiteSurveyButton;
