import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import Box from '@mui/material/Box';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { Tooltip } from '@skybrush/mui-components';

import ColoredButton from '~/components/ColoredButton';
import Colors from '~/components/colors';
import PrerequisiteList from '~/components/PrerequisiteList';
import {
  hasLicenseWithProFeatures,
  supportsSuspendResumeCRTH,
} from '~/features/servers/selectors';
import {
  resumeShow,
  startCollectiveRTH,
  suspendShow,
} from '~/features/show/actions';
import {
  selectCollectiveRTHPlanSummary,
  selectIsCollectiveRTHTriggered,
} from '~/features/show/selectors';
import { showWarning } from '~/features/snackbar/actions';
import {
  useConstPrerequisites,
  type Prerequisite,
} from '~/hooks/useConstPrerequisites';
import { tt } from '~/i18n';
import HomeCircleOutlined from '~/icons/HomeCircleOutlined';
import { type RootState } from '~/store/reducers';
import { Workbench } from '~/workbench';

const GENERAL_PREREQUISITES: readonly Prerequisite[] = Object.freeze([
  {
    selector: (state: RootState) => hasLicenseWithProFeatures(state) ?? false,
    message: tt('proControlButtonGroup.prerequisites.proFeaturesEnabled'),
  },
  {
    selector: supportsSuspendResumeCRTH,
    message: tt(
      'proControlButtonGroup.prerequisites.supportsSuspendResumeCRTH'
    ),
  },
  {
    selector: (state: RootState) => !selectIsCollectiveRTHTriggered(state),
    message: tt(
      'proControlButtonGroup.prerequisites.collectiveRTHNotTriggered'
    ),
  },
]);

const CRTH_PREREQUISITES: readonly Prerequisite[] = Object.freeze([
  {
    selector: (state: RootState) =>
      selectCollectiveRTHPlanSummary(state).isValid,
    message: tt('proControlButtonGroup.prerequisites.hasCollectiveRTHPlan'),
  },
  ...GENERAL_PREREQUISITES,
]);

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  buttonWrapper: {
    display: 'flex',
    flex: 1,
    margin: theme.spacing(0.5),
    lineHeight: '1 !important',
  },
  button: {
    flex: 1,
  },
}));

type DispatchProps = {
  resumeShow: () => void;
  startCollectiveRTH: () => void;
  suspendShow: () => void;
};

type Props = DispatchProps;

const ProControlButtonGroup = (props: Props) => {
  const { resumeShow, startCollectiveRTH, suspendShow } = props;
  const workbench = useContext(Workbench);
  const classes = useStyles();
  const { t } = useTranslation();

  const { prerequisites, prerequisitesFulfilled } = useConstPrerequisites(
    GENERAL_PREREQUISITES
  );
  const {
    prerequisites: crthPrerequisites,
    prerequisitesFulfilled: crthPrerequisitesFulfilled,
  } = useConstPrerequisites(CRTH_PREREQUISITES);

  return (
    <Box className={classes.root}>
      <Tooltip
        disabled={prerequisitesFulfilled}
        content={<PrerequisiteList prerequisites={prerequisites} />}
      >
        <div tabIndex={0} className={classes.buttonWrapper}>
          <ColoredButton
            className={classes.button}
            color={Colors.positionHold}
            disabled={!prerequisitesFulfilled}
            icon={<PauseCircleOutlined fontSize='inherit' />}
            onClick={suspendShow}
          >
            {t('proControlButtonGroup.suspend')}
          </ColoredButton>
        </div>
      </Tooltip>
      <Tooltip
        disabled={prerequisitesFulfilled}
        content={<PrerequisiteList prerequisites={prerequisites} />}
      >
        <div tabIndex={0} className={classes.buttonWrapper}>
          <ColoredButton
            className={classes.button}
            color={Colors.success}
            disabled={!prerequisitesFulfilled}
            icon={<PlayCircleOutlined fontSize='inherit' />}
            onClick={resumeShow}
          >
            {t('proControlButtonGroup.resume')}
          </ColoredButton>
        </div>
      </Tooltip>
      <Tooltip
        disabled={crthPrerequisitesFulfilled}
        content={<PrerequisiteList prerequisites={crthPrerequisites} />}
      >
        <div tabIndex={0} className={classes.buttonWrapper}>
          <ColoredButton
            className={classes.button}
            color={Colors.seriousWarning}
            disabled={!crthPrerequisitesFulfilled}
            icon={<HomeCircleOutlined fontSize='inherit' />}
            onClick={() => {
              startCollectiveRTH();
              if (!workbench.bringToFront('collectiveRTH')) {
                showWarning(
                  t('proControlButtonGroup.collectiveRTHPanelNotFound')
                );
              }
            }}
          >
            {t('proControlButtonGroup.collectiveRTH')}
          </ColoredButton>
        </div>
      </Tooltip>
    </Box>
  );
};

const ConnectedProControlButtonGroup = connect(null, {
  resumeShow,
  startCollectiveRTH,
  suspendShow,
})(ProControlButtonGroup);

export default ConnectedProControlButtonGroup;
