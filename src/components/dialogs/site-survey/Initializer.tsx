import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import React from 'react';

import type { ShowData } from '~/features/site-survey/state';

import type {
  DataSourcesProps,
  DispatchProps,
  TranslationProps,
} from './types';

const useCardStyles = makeStyles(() => ({
  card: {
    minWidth: 400,
  },
  actions: {
    justifyContent: 'flex-end',
  },
}));

type InitCardProps = {
  title: string;
  description: string;
  requirements: string[];
  action: string;
  showData: ShowData | undefined;
  initializeWithData: (show: ShowData) => void;
};

/**
 * A single initialization action displayed as a card.
 */
function InitCard(props: InitCardProps) {
  const {
    title,
    description,
    requirements,
    action,
    showData,
    initializeWithData,
  } = props;
  const styles = useCardStyles();

  return (
    <Card className={styles.card}>
      <CardContent>
        <CardHeader title={title} />
        <Typography variant='body1'>{description}</Typography>
        {requirements && (
          <ul>
            {requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardActions className={styles.actions}>
        <Button
          color='primary'
          disabled={showData === undefined}
          onClick={() => {
            if (showData) {
              initializeWithData(showData);
            }
          }}
        >
          {action}
        </Button>
      </CardActions>
    </Card>
  );
}

const useInitializerStyles = makeStyles((theme) => ({
  box: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
}));

type InitializerProps = TranslationProps & DispatchProps & DataSourcesProps;

/**
 * Component that lets the user initialize the site survey dialog with data from various sources.
 */
function Initializer(props: InitializerProps) {
  const { closeDialog, initializeWithData, t, dataSources } = props;
  const styles = useInitializerStyles();
  const initActionText = t('siteSurveyDialog.initializer.action');

  return (
    <Box className={styles.box}>
      <InitCard
        title={t('siteSurveyDialog.initializer.show.title')}
        description={t('siteSurveyDialog.initializer.show.description')}
        requirements={[
          t('siteSurveyDialog.initializer.show.requirement.showLoaded'),
          t('siteSurveyDialog.initializer.show.requirement.hasShowSegment'),
          t('siteSurveyDialog.initializer.show.requirement.showOriginSet'),
        ]}
        action={initActionText}
        showData={dataSources.show}
        initializeWithData={initializeWithData}
      />
      <Button onClick={closeDialog}>{t('general.action.close')}</Button>
    </Box>
  );
}

export default Initializer;
