import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@skybrush/app-theme-mui';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ColoredButton from '~/components/ColoredButton';
import Colors from '~/components/colors';
import { hasLicenseWithProFeatures } from '~/features/servers/selectors';
import { showError } from '~/features/snackbar/actions';
import PauseCircle from '~/icons/PauseCircle';
import PlayCircle from '~/icons/PlayCircle';
import messageHub from '~/message-hub';
import { type RootState } from '~/store/reducers';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  button: {
    flex: 1,
    margin: theme.spacing(0.5),
    lineHeight: '1 !important',
  },
}));

type StateProps = {
  proFeaturesEnabled?: boolean;
};

type DispatchProps = {
  showError: (message: string) => void;
};

type Props = StateProps & DispatchProps;

const ProControlButtonGroup = (props: Props) => {
  const { proFeaturesEnabled, showError } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <Box className={classes.root}>
      <ColoredButton
        className={classes.button}
        color={Colors.warning}
        disabled={!proFeaturesEnabled}
        icon={<PauseCircle fontSize='inherit' />}
        onClick={() => {
          void messageHub.execute.suspendShow().catch((error: Error) => {
            showError(error.message);
          });
        }}
      >
        <Typography variant='body2'>
          {t('proControlButtonGroup.suspend')}
        </Typography>
      </ColoredButton>
      <ColoredButton
        className={classes.button}
        color={Colors.success}
        disabled={!proFeaturesEnabled}
        icon={<PlayCircle fontSize='inherit' />}
        onClick={() => {
          void messageHub.execute.resumeShow().catch((error: Error) => {
            showError(error.message);
          });
        }}
      >
        <Typography variant='body2'>
          {t('proControlButtonGroup.resume')}
        </Typography>
      </ColoredButton>
    </Box>
  );
};

const ConnectedProControlButtonGroup = connect(
  (state: RootState) => ({
    proFeaturesEnabled: hasLicenseWithProFeatures(state),
  }),
  { showError }
)(ProControlButtonGroup);

export default ConnectedProControlButtonGroup;
