import Home from '@mui/icons-material/Home';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@skybrush/app-theme-mui';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ColoredButton from '~/components/ColoredButton';
import Colors from '~/components/colors';
import { hasLicenseWithProFeatures } from '~/features/servers/selectors';
import {
  resumeShow,
  startCollectiveRTH,
  suspendShow,
} from '~/features/show/actions';
import { selectIsCollectiveRTHTriggered } from '~/features/show/selectors/rth';
import PauseCircle from '~/icons/PauseCircle';
import PlayCircle from '~/icons/PlayCircle';
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
  isCollectiveRTHTriggered: boolean;
  proFeaturesEnabled?: boolean;
};

type DispatchProps = {
  resumeShow: () => void;
  suspendShow: () => void;
  startCollectiveRTH: () => void;
};

type Props = StateProps & DispatchProps;

const ProControlButtonGroup = (props: Props) => {
  const {
    isCollectiveRTHTriggered,
    proFeaturesEnabled,
    resumeShow,
    startCollectiveRTH,
    suspendShow,
  } = props;
  const actionsDisabled = isCollectiveRTHTriggered || !proFeaturesEnabled;
  const classes = useStyles();
  const { t } = useTranslation();
  return (
    <Box className={classes.root}>
      <ColoredButton
        className={classes.button}
        color={Colors.positionHold}
        disabled={actionsDisabled}
        icon={<PauseCircle fontSize='inherit' />}
        onClick={() => suspendShow()}
      >
        <Typography variant='body2'>
          {t('proControlButtonGroup.suspend')}
        </Typography>
      </ColoredButton>
      <ColoredButton
        className={classes.button}
        color={Colors.success}
        disabled={actionsDisabled}
        icon={<PlayCircle fontSize='inherit' />}
        onClick={() => resumeShow()}
      >
        <Typography variant='body2'>
          {t('proControlButtonGroup.resume')}
        </Typography>
      </ColoredButton>
      <ColoredButton
        className={classes.button}
        color={Colors.seriousWarning}
        disabled={actionsDisabled}
        icon={<Home fontSize='inherit' />}
        onClick={() => startCollectiveRTH()}
      >
        <Typography variant='body2'>
          {t('proControlButtonGroup.collectiveRTH')}
        </Typography>
      </ColoredButton>
    </Box>
  );
};

const ConnectedProControlButtonGroup = connect(
  (state: RootState) => ({
    isCollectiveRTHTriggered: selectIsCollectiveRTHTriggered(state),
    proFeaturesEnabled: hasLicenseWithProFeatures(state),
  }),
  { resumeShow, suspendShow, startCollectiveRTH }
)(ProControlButtonGroup);

export default ConnectedProControlButtonGroup;
