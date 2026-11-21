import Healing from '@mui/icons-material/Healing';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import Box from '@mui/material/Box';
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
  getMeanSeaLevelReferenceOfShowCoordinatesOrNull,
  isShowAuthorizedToStartLocally,
  selectCollectiveRTHPlanSummary,
  selectIsCollectiveRTHTriggered,
} from '~/features/show/selectors';
import { showShowHealingDialog } from '~/features/show-healing/slice';
import {
  useConstPrerequisites,
  type Prerequisite,
} from '~/hooks/useConstPrerequisites';
import { tt } from '~/i18n';
import HomeCircleOutlined from '~/icons/HomeCircleOutlined';
import { type RootState } from '~/store/reducers';

const GENERAL_PREREQUISITES: readonly Prerequisite[] = Object.freeze([
  {
    id: 'proFeaturesEnabled',
    selector: (state: RootState) => hasLicenseWithProFeatures(state) ?? false,
    message: tt('proControlButtonGroup.prerequisites.proFeaturesEnabled'),
  },
  {
    id: 'supportsSuspendResumeCRTH',
    selector: supportsSuspendResumeCRTH,
    message: tt(
      'proControlButtonGroup.prerequisites.supportsSuspendResumeCRTH'
    ),
  },
  {
    id: 'collectiveRTHNotTriggered',
    selector: (state: RootState) => !selectIsCollectiveRTHTriggered(state),
    message: tt(
      'proControlButtonGroup.prerequisites.collectiveRTHNotTriggered'
    ),
  },
]);

const CRTH_PREREQUISITES: readonly Prerequisite[] = Object.freeze([
  {
    id: 'hasCollectiveRTHPlan',
    selector: (state: RootState) =>
      selectCollectiveRTHPlanSummary(state).isValid,
    message: tt('proControlButtonGroup.prerequisites.hasCollectiveRTHPlan'),
  },
  ...GENERAL_PREREQUISITES,
]);

// TODO: show healing requires a newer server version (around 2.62) than
// `supportsSuspendResumeCRTH` in GENERAL_PREREQUISITES checks for; add a
// dedicated version check once that server version is released.
const HEAL_PREREQUISITES: readonly Prerequisite[] = Object.freeze([
  {
    id: 'showAuthorized',
    selector: isShowAuthorizedToStartLocally,
    message: tt('proControlButtonGroup.prerequisites.showAuthorized'),
  },
  {
    id: 'hasAMSLReference',
    selector: (state: RootState) =>
      getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state) !== null,
    message: tt('proControlButtonGroup.prerequisites.hasAMSLReference'),
  },
  ...GENERAL_PREREQUISITES,
]);

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: theme.spacing(1),
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    maxHeight: 100,
    gap: theme.spacing(1),
  },
  buttonWrapper: {
    display: 'flex',
    flex: 1,
  },
  button: {
    flex: 1,
    lineHeight: '1 !important',
  },
}));

type DispatchProps = {
  resumeShow: () => void;
  showShowHealingDialog: () => void;
  startCollectiveRTH: () => void;
  suspendShow: () => void;
};

type Props = DispatchProps;

const ProControlButtonGroup = (props: Props) => {
  const { resumeShow, showShowHealingDialog, startCollectiveRTH, suspendShow } =
    props;
  const classes = useStyles();
  const { t } = useTranslation();

  const { prerequisites, prerequisitesFulfilled } = useConstPrerequisites(
    GENERAL_PREREQUISITES
  );
  const {
    prerequisites: crthPrerequisites,
    prerequisitesFulfilled: crthPrerequisitesFulfilled,
  } = useConstPrerequisites(CRTH_PREREQUISITES);
  const {
    prerequisites: healPrerequisites,
    prerequisitesFulfilled: healPrerequisitesFulfilled,
  } = useConstPrerequisites(HEAL_PREREQUISITES);

  return (
    <Box className={classes.root}>
      <Box className={classes.row}>
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
      </Box>
      <Box className={classes.row}>
        <Tooltip
          disabled={healPrerequisitesFulfilled}
          content={<PrerequisiteList prerequisites={healPrerequisites} />}
        >
          <div tabIndex={0} className={classes.buttonWrapper}>
            <ColoredButton
              className={classes.button}
              color={Colors.main}
              disabled={!healPrerequisitesFulfilled}
              icon={<Healing fontSize='inherit' />}
              onClick={showShowHealingDialog}
            >
              {t('proControlButtonGroup.heal')}
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
              }}
            >
              {t('proControlButtonGroup.collectiveRTH')}
            </ColoredButton>
          </div>
        </Tooltip>
      </Box>
    </Box>
  );
};

const ConnectedProControlButtonGroup = connect(null, {
  resumeShow,
  showShowHealingDialog,
  startCollectiveRTH,
  suspendShow,
})(ProControlButtonGroup);

export default ConnectedProControlButtonGroup;
