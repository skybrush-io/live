import Add from '@mui/icons-material/Add';
import CloudDownload from '@mui/icons-material/CloudDownload';
import Flight from '@mui/icons-material/Flight';
import Schedule from '@mui/icons-material/Schedule';
import Settings from '@mui/icons-material/Settings';
import UploadFile from '@mui/icons-material/UploadFile';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { createSelector } from '@reduxjs/toolkit';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import { Status } from '~/components/semantics';
import { AltitudeReference } from '~/features/show/constants';
import { loadShowFromFile } from '~/features/show/actions';
import {
  getOutdoorShowAltitudeReference,
  getShowDescription,
  getShowEnvironmentType,
  getShowStartTimeAsString,
  getShowTitle,
  hasLoadedShowFile,
} from '~/features/show/selectors';
import {
  openEnvironmentEditorDialog,
  openLoadShowFromCloudDialog,
  openStartTimeDialog,
  openTakeoffAreaSetupDialog,
} from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { getUAVIdsParticipatingInMission } from '~/features/mission/selectors';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';
import { isUploadInProgress } from '~/features/upload/selectors';
import { openUploadDialogForJob } from '~/features/upload/slice';
import { hasFeature } from '~/utils/configuration';
import { formatDistance, truncate } from '~/utils/formatting';

const EXTENSIONS = ['.skyc'];
const isFile = (item) => item?.size > 0;

const getEnvironmentDescription = createSelector(
  getShowEnvironmentType,
  getOutdoorShowAltitudeReference,
  (environmentType, outdoorAltitudeReference) => {
    switch (environmentType) {
      case 'indoor':
        return 'indoor';
      case 'outdoor': {
        const { type, value } = outdoorAltitudeReference;
        if (type === AltitudeReference.AMSL && Number.isFinite(value)) {
          return 'outdoorAMSL';
        }
        return 'outdoor';
      }
      default:
        return 'unknown';
    }
  }
);

const statusColor = (status) => {
  switch (status) {
    case Status.SUCCESS:
    case Status.SKIPPED:
      return '#3ecf6e';
    case Status.ERROR:
    case Status.CRITICAL:
      return '#e85d5d';
    case Status.WAITING:
    case Status.NEXT:
      return '#e8b339';
    default:
      return 'rgba(255,255,255,0.22)';
  }
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    minWidth: 0,
    padding: theme.spacing(0.75, 1.25, 1),
  },
  title: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    lineHeight: 1,
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
  },
  track: {
    alignItems: 'stretch',
    display: 'grid',
    flex: 1,
    gap: theme.spacing(0.5),
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    minHeight: 0,
    minWidth: 0,
    paddingBottom: theme.spacing(0.25),
    position: 'relative',
    width: '100%',

    '&::before': {
      backgroundColor: 'rgba(255,255,255,0.14)',
      content: '""',
      height: 2,
      left: '10%',
      pointerEvents: 'none',
      position: 'absolute',
      right: '10%',
      top: 52,
      zIndex: 0,
    },

    [theme.breakpoints.down('md')]: {
      gap: theme.spacing(0.75),
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      overflowX: 'auto',

      '&::before': {
        display: 'none',
      },
    },
  },

  trackWithAdd: {
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr)) auto',

    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto',
    },
  },
  step: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minWidth: 0,
    padding: 0,
    position: 'relative',
    width: '100%',
    zIndex: 1,

    '&:disabled': {
      cursor: 'default',
      opacity: 0.45,
    },
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 'clamp(0.56rem, 0.75vw, 0.62rem)',
    fontWeight: 600,
    lineHeight: 1.2,
    marginBottom: theme.spacing(0.75),
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stepCircle: {
    alignItems: 'center',
    border: '2px solid transparent',
    borderRadius: '50%',
    display: 'flex',
    flexShrink: 0,
    height: 'clamp(34px, 4vw, 40px)',
    justifyContent: 'center',
    position: 'relative',
    width: 'clamp(34px, 4vw, 40px)',
    zIndex: 1,
  },
  stepIcon: {
    fontSize: '1.1rem',
  },
  stepSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 'clamp(0.52rem, 0.65vw, 0.58rem)',
    lineHeight: 1.25,
    marginTop: theme.spacing(0.75),
    maxWidth: '100%',
    overflow: 'hidden',
    paddingInline: theme.spacing(0.25),
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  addButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.55)',
    flexShrink: 0,
    height: 'clamp(30px, 3.5vw, 36px)',
    justifySelf: 'center',
    width: 'clamp(30px, 3.5vw, 36px)',
    zIndex: 1,
  },
}));

const MissionStepContent = ({
  classes,
  icon: Icon,
  label,
  status,
  sublabel,
}) => (
  <>
    <Typography className={classes.stepLabel} component='span' title={label}>
      {label}
    </Typography>
    <Box
      className={classes.stepCircle}
      sx={{
        backgroundColor: `${statusColor(status)}22`,
        borderColor: statusColor(status),
        color:
          status === Status.OFF ? 'rgba(255,255,255,0.35)' : statusColor(status),
      }}
    >
      <Icon className={classes.stepIcon} />
    </Box>
    <Typography className={classes.stepSub} component='span' title={sublabel}>
      {sublabel}
    </Typography>
  </>
);

MissionStepContent.propTypes = {
  classes: PropTypes.object.isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  status: PropTypes.string,
  sublabel: PropTypes.string,
};

const MissionStep = ({
  classes,
  disabled,
  icon,
  label,
  onClick,
  status,
  sublabel,
}) => (
  <button
    className={classes.step}
    disabled={disabled}
    onClick={onClick}
    type='button'
  >
    <MissionStepContent
      classes={classes}
      icon={icon}
      label={label}
      status={status}
      sublabel={sublabel}
    />
  </button>
);

MissionStep.propTypes = {
  classes: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  status: PropTypes.string,
  sublabel: PropTypes.string,
};

const MissionSetupStrip = ({
  environmentKey,
  formattedStartTime,
  hasLoadedFile,
  isUploading,
  maxDistance,
  missionDroneCount,
  onEditEnvironment,
  onLoadFromCloud,
  onOpenStartTime,
  onOpenTakeoffArea,
  onOpenUpload,
  onShowFileSelected,
  showDescription,
  showTitle,
  stageStatuses,
}) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const exportFileInputRef = useRef(null);

  const handleExportPathClick = useCallback(() => {
    if (exportFileInputRef.current) {
      exportFileInputRef.current.value = '';
      exportFileInputRef.current.click();
    }
  }, []);

  const handleExportFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (file && isFile(file)) {
        onShowFileSelected(file);
      }
      event.target.value = '';
    },
    [onShowFileSelected]
  );

  const exportSub = useMemo(() => {
    if (missionDroneCount > 0) {
      return t('bottomBar.droneCount', { count: missionDroneCount });
    }
    if (hasLoadedFile && showTitle) {
      return truncate(showTitle, 18);
    }
    if (hasLoadedFile && showDescription) {
      return truncate(showDescription, 18);
    }
    return t('bottomBar.noShowLoaded');
  }, [
    hasLoadedFile,
    missionDroneCount,
    showDescription,
    showTitle,
    t,
  ]);

  const environmentSub = useMemo(() => {
    switch (environmentKey) {
      case 'indoor':
        return t('show.indoor');
      case 'outdoor':
        return t('show.outdoor.relativeToHome');
      case 'outdoorAMSL':
        return t('show.outdoor.relativeToHome');
      default:
        return t('show.unknown');
    }
  }, [environmentKey, t]);

  const placementSub = useMemo(() => {
    const status = stageStatuses.setupTakeoffArea;
    if (typeof maxDistance === 'number' && Number.isFinite(maxDistance)) {
      return t('show.placementAccuracy', {
        distance: formatDistance(maxDistance),
      });
    }
    switch (status) {
      case Status.SUCCESS:
        return t('show.dronePlacementApproved');
      case Status.SKIPPED:
        return t('show.dronePlacementPartial');
      default:
        return t('show.takeOffPlace');
    }
  }, [maxDistance, stageStatuses.setupTakeoffArea, t]);

  const uploadSub = useMemo(() => {
    if (isUploading) {
      return t('show.uploadShowDataLoading');
    }
    switch (stageStatuses.uploadShow) {
      case Status.SUCCESS:
        return t('bottomBar.ready');
      case Status.ERROR:
        return t('bottomBar.failed');
      default:
        return t('bottomBar.tapToUpload');
    }
  }, [isUploading, stageStatuses.uploadShow, t]);

  const startTimeSub =
    formattedStartTime || t('show.chooseStartTimeNotSet');

  const steps = [
    {
      key: 'export',
      label: t('bottomBar.exportPath'),
      icon: CloudDownload,
      status: stageStatuses.selectShowFile,
      sublabel: exportSub,
      disabled: false,
      onClick: handleExportPathClick,
    },
    {
      key: 'environment',
      label: t('bottomBar.environmentSetup'),
      icon: Settings,
      status: stageStatuses.setupEnvironment,
      sublabel: environmentSub,
      disabled: stageStatuses.setupEnvironment === Status.OFF,
      onClick: onEditEnvironment,
    },
    {
      key: 'placement',
      label: t('bottomBar.dronePlacement'),
      icon: Flight,
      status: stageStatuses.setupTakeoffArea,
      sublabel: placementSub,
      disabled: stageStatuses.setupTakeoffArea === Status.OFF,
      onClick: onOpenTakeoffArea,
    },
    {
      key: 'upload',
      label: t('bottomBar.uploadData'),
      icon: UploadFile,
      status: stageStatuses.uploadShow,
      sublabel: uploadSub,
      disabled: stageStatuses.uploadShow === Status.OFF,
      onClick: onOpenUpload,
    },
    {
      key: 'startTime',
      label: t('bottomBar.startTime'),
      icon: Schedule,
      status: stageStatuses.setupStartTime,
      sublabel: startTimeSub,
      disabled: false,
      onClick: onOpenStartTime,
    },
  ];

  return (
    <Box className={classes.root}>
      <Typography className={classes.title} component='div'>
        {t('bottomBar.missionSetup')}
      </Typography>
      <Box
        className={`${classes.track} ${
          hasFeature('loadShowFromCloud') ? classes.trackWithAdd : ''
        }`}
      >
        <input
          ref={exportFileInputRef}
          accept={EXTENSIONS.join(',')}
          hidden
          id='bottom-bar-show-file-upload'
          type='file'
          onChange={handleExportFileChange}
        />
        {steps.map((step) => (
          <MissionStep
            key={step.key}
            classes={classes}
            disabled={step.disabled}
            icon={step.icon}
            label={step.label}
            onClick={step.onClick}
            status={step.status}
            sublabel={step.sublabel}
          />
        ))}
        {hasFeature('loadShowFromCloud') ? (
          <IconButton
            aria-label={t('show.fromCloud')}
            className={classes.addButton}
            onClick={onLoadFromCloud}
            size='small'
          >
            <Add fontSize='small' />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  );
};

MissionSetupStrip.propTypes = {
  environmentKey: PropTypes.string,
  formattedStartTime: PropTypes.string,
  hasLoadedFile: PropTypes.bool,
  isUploading: PropTypes.bool,
  maxDistance: PropTypes.number,
  missionDroneCount: PropTypes.number,
  onEditEnvironment: PropTypes.func,
  onLoadFromCloud: PropTypes.func,
  onOpenStartTime: PropTypes.func,
  onOpenTakeoffArea: PropTypes.func,
  onOpenUpload: PropTypes.func,
  onShowFileSelected: PropTypes.func,
  showDescription: PropTypes.string,
  showTitle: PropTypes.string,
  stageStatuses: PropTypes.object,
};

export default connect(
  (state) => ({
    environmentKey: getEnvironmentDescription(state),
    formattedStartTime: getShowStartTimeAsString(state),
    hasLoadedFile: hasLoadedShowFile(state),
    isUploading: isUploadInProgress(state),
    maxDistance: getFarthestDistanceFromHome(state),
    missionDroneCount: getUAVIdsParticipatingInMission(state).length,
    showDescription: getShowDescription(state),
    showTitle: getShowTitle(state),
    stageStatuses: getSetupStageStatuses(state),
  }),
  {
    onEditEnvironment: openEnvironmentEditorDialog,
    onLoadFromCloud: openLoadShowFromCloudDialog,
    onOpenStartTime: openStartTimeDialog,
    onOpenTakeoffArea: openTakeoffAreaSetupDialog,
    onOpenUpload: () => openUploadDialogForJob({ job: SHOW_UPLOAD_JOB }),
    onShowFileSelected: loadShowFromFile,
  }
)(MissionSetupStrip);
