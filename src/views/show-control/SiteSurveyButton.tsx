import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

// @ts-ignore
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { selectSiteSurveyDataFromShow } from '~/features/site-survey/selectors';
import { type ShowData, showDialog } from '~/features/site-survey/state';
import type { RootState } from '~/store/reducers';

type Props = {
  show: ShowData | undefined;
  showDialog: (data?: ShowData) => void;
};

function SiteSurveyButton(props: Props) {
  const { show, showDialog } = props;
  const { t } = useTranslation();

  const openWithShow = useCallback(() => {
    if (show) {
      showDialog(show);
    }
  }, [show, showDialog]);

  return (
    <ListItem button disabled={show === undefined} onClick={openWithShow}>
      <StatusLight status={Status.INFO} />
      <ListItemText
        primary={t('show.siteSurvey.button')}
        secondary={t('show.siteSurvey.description')}
      />
    </ListItem>
  );
}

const ConnectedSiteSurveyButton = connect(
  (state: RootState) => ({
    show: selectSiteSurveyDataFromShow(state),
  }),
  {
    showDialog,
  }
)(SiteSurveyButton);

export default ConnectedSiteSurveyButton;
