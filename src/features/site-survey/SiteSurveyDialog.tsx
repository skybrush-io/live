import Backdrop from '@material-ui/core/Backdrop';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { makeStyles } from '@material-ui/core/styles';
import type { TFunction } from 'i18next';
import React, { useCallback, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { batch, connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';
import type { ValidationSettings } from '@skybrush/show-format';

import DialogHelpIcon from '~/components/DialogHelpIcon';
import ToolbarDivider from '~/components/ToolbarDivider';
import { loadBase64EncodedShow } from '~/features/show/actions';
import { getShowValidationSettings } from '~/features/show/selectors';
import {
  setOutdoorShowOrientation,
  setOutdoorShowOrigin,
} from '~/features/show/slice';
import type { OutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import type { AppDispatch, RootState } from '~/store/reducers';
import { type LonLat } from '~/utils/geography';

import AdaptParametersForm, {
  useAdaptParametersFormState,
} from './AdaptParametersForm';
import AdaptReviewForm from './AdaptReviewForm';
import InteractionHints from './InteractionHints';
import Map from './SiteSurveyMap';
import {
  adaptShow,
  adjustHomePositionsToDronePositions,
  saveAdaptedShow,
  type ShowAdaptParameters,
} from './actions';
import {
  isSiteSurveyDialogOpen,
  selectAdaptedShowAsBase64String,
  selectAdjustHomePositionsToDronePositionsEnabled,
  selectCoordinateSystem,
  selectDronesVisible,
  selectIsShowAdaptInProgress,
} from './selectors';
import { closeDialog, setAdaptResult, setDronesVisible } from './state';

const useStyles = makeStyles((theme) => ({
  /* Ugly hack to move the sidebar to the right */
  root: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& div.MuiDialog-paper > div > div:first-child': {
      order: 100,
      boxShadow: '2px 0 6px -2px inset rgba(0, 0, 0, 0.54)',
    },
  },
  backdrop: {
    position: 'absolute',
    zIndex: theme.zIndex.modal + 1,
  },
  contentRoot: {
    flex: 1,
    minHeight: 'calc(100vh - 256px)',
    position: 'relative',
  },
  contentItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainContent: {
    padding: theme.spacing(1),
  },
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
  },
  shadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    boxShadow: '-1px 0 6px 2px inset rgba(0, 0, 0, 0.54)',
    pointerEvents: 'none',
    zIndex: 10,
  },
}));

type DispatchProps = Readonly<{
  adaptShow: (parameters: ShowAdaptParameters) => void;
  adjustHomePositionsToDronePositions: () => void;
  approveAdaptedShow: (
    base64Blob: string,
    showOrigin: LonLat,
    showOrientation: string
  ) => void;
  closeDialog: () => void;
  resetAdaptResult: () => void;
  saveAdaptedShow: () => void;
  setDronesVisible: (value: boolean) => void;
}>;

type StateProps = Readonly<{
  adaptedBase64Show: string | undefined;
  backDisabled: boolean;
  adjustHomePositionsToDronePositionsEnabled: boolean;
  coordinateSystem: OutdoorCoordinateSystemWithOrigin;
  open: boolean;
  validationSettings: ValidationSettings | undefined;
  dronesVisible: boolean;
}>;

type Props = StateProps &
  DispatchProps &
  Readonly<{
    t: TFunction;
  }>;

type AdaptStage = 'config' | 'review';

const hiddenStyle: React.CSSProperties = {
  display: 'none',
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useOwnState(props: Props) {
  const {
    adaptShow,
    adaptedBase64Show,
    approveAdaptedShow,
    backDisabled,
    closeDialog,
    coordinateSystem,
    resetAdaptResult,
    validationSettings,
  } = props;
  const [stage, setStage] = useState<AdaptStage>('config');
  const adaptParameters = useAdaptParametersFormState(
    validationSettings === undefined
      ? undefined
      : {
          minDistance: validationSettings.minDistance,
          horizontalVelocity: validationSettings.maxVelocityXY,
          verticalVelocity: validationSettings.maxVelocityZ,
        },
    resetAdaptResult
  );

  const back = useCallback(() => {
    if (backDisabled) {
      // Shouldn't happen, because the button should be disabled.
      console.error('Back actions is disabled but action was triggered.');
      return;
    }

    if (stage === 'config') {
      closeDialog();
    } else if (stage === 'review') {
      setStage('config');
    }
  }, [backDisabled, closeDialog, stage]);

  const submitDisabled =
    !adaptParameters.isValid ||
    (stage === 'review' && adaptedBase64Show === undefined);

  const submit = useCallback(() => {
    if (submitDisabled) {
      // Shouldn't happen.
      console.error('Submit action is disabled but action was triggered.');
      return;
    }

    if (stage === 'config') {
      if (!adaptParameters.isValid) {
        return;
      }

      if (adaptedBase64Show === undefined) {
        adaptShow(adaptParameters.parameters);
      }

      setStage('review');
    } else if (stage === 'review') {
      if (adaptedBase64Show === undefined) {
        // Shouldn't happen.
        console.error('Adapted show is undefined');
        return;
      }

      approveAdaptedShow(
        adaptedBase64Show,
        coordinateSystem.origin,
        coordinateSystem.orientation
      );
      setStage('config');
      closeDialog();
    }
  }, [
    adaptParameters,
    adaptShow,
    adaptedBase64Show,
    approveAdaptedShow,
    closeDialog,
    coordinateSystem,
    stage,
    submitDisabled,
  ]);

  return {
    adaptedBase64Show,
    adaptParameters,
    adaptShow,
    approveAdaptedShow,
    back,
    coordinateSystem,
    stage,
    submit,
    submitDisabled,
  };
}

const SiteSurveyDialog = (props: Props): JSX.Element => {
  const {
    adjustHomePositionsToDronePositionsEnabled,
    adjustHomePositionsToDronePositions,
    backDisabled,
    dronesVisible,
    saveAdaptedShow,
    setDronesVisible,
    open,
    t,
  } = props;
  const styles = useStyles();
  const { adaptParameters, back, stage, submit, submitDisabled } =
    useOwnState(props);

  return (
    <DraggableDialog
      fullWidth
      disableEscapeKeyDown
      className={styles.root}
      maxWidth='xl'
      title={t('siteSurveyDialog.title')}
      open={open}
      sidebarComponents={
        <Box className={styles.sidebarContent}>
          <AdaptParametersForm
            {...adaptParameters}
            disabled={stage !== 'config'}
          />
          <FormControlLabel
            control={
              <Switch
                checked={dronesVisible}
                onChange={(event) => {
                  setDronesVisible(event.target.checked);
                }}
              />
            }
            label={t('siteSurveyDialog.settings.dronesVisible')}
          />
          <Button
            color='primary'
            disabled={!adjustHomePositionsToDronePositionsEnabled}
            onClick={() => {
              adjustHomePositionsToDronePositions();
            }}
          >
            {t('siteSurveyDialog.action.adjustHomePositionsToDronePositions')}
          </Button>
        </Box>
      }
      onClose={props.closeDialog}
    >
      <Box className={styles.contentRoot}>
        <Box className={styles.contentItem}>
          <Map />
        </Box>
        <Backdrop className={styles.backdrop} open={stage === 'review'}>
          <AdaptReviewForm />
        </Backdrop>
        <Box className={styles.shadowOverlay} />
      </Box>
      <DialogActions>
        <DialogHelpIcon
          content={t(`siteSurveyDialog.help.${stage}`)
            .split('\n')
            .map((item, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <p key={idx}>{item}</p>
            ))}
        />
        <ToolbarDivider orientation='vertical' />
        <InteractionHints />
        <Box flex={1} />
        <Button disabled={backDisabled} onClick={back}>
          {stage === 'review'
            ? t('general.action.back')
            : t('general.action.close')}
        </Button>
        {stage === 'review' && (
          <Button
            color='primary'
            disabled={submitDisabled}
            onClick={saveAdaptedShow}
          >
            {t('general.action.save')}
          </Button>
        )}
        <Button color='primary' disabled={submitDisabled} onClick={submit}>
          {stage === 'review'
            ? t('general.action.approve')
            : t('siteSurveyDialog.action.adapt')}
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

/**
 * Wrapper that only renders the dialog when it is open.
 *
 * The reason for this is to correctly initialize the dialog's state
 * when it is opened.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
const SiteSurveyDialogWrapper = (props: Props): JSX.Element | null => {
  const { open, ...rest } = props;
  return open ? <SiteSurveyDialog open {...rest} /> : null;
};

const ConnectedSiteSurveyDialogWrapper = connect(
  // -- map state to props
  (state: RootState) => ({
    adaptedBase64Show: selectAdaptedShowAsBase64String(state),
    adjustHomePositionsToDronePositionsEnabled:
      selectAdjustHomePositionsToDronePositionsEnabled(state),
    backDisabled: selectIsShowAdaptInProgress(state),
    coordinateSystem: selectCoordinateSystem(state),
    dronesVisible: selectDronesVisible(state),
    open: isSiteSurveyDialogOpen(state),
    // Take validation settings directly from the loaded show.
    // We'll copy that to the dialog's state when necessary.
    validationSettings: getShowValidationSettings(state),
  }),
  // -- map dispatch to props
  (dispatch: AppDispatch) => ({
    adaptShow: (params: ShowAdaptParameters): void => {
      dispatch(adaptShow(params));
    },
    adjustHomePositionsToDronePositions: (): void => {
      dispatch(adjustHomePositionsToDronePositions());
    },
    approveAdaptedShow: (
      base64Blob: string,
      showOrigin: LonLat,
      showOrientation: string
    ): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      batch((): void => {
        dispatch(setOutdoorShowOrigin(showOrigin));
        dispatch(setOutdoorShowOrientation(showOrientation));
        dispatch(loadBase64EncodedShow(base64Blob));
      });
    },
    closeDialog: (): void => {
      dispatch(closeDialog());
    },
    resetAdaptResult: (): void => {
      dispatch(setAdaptResult(undefined));
    },
    saveAdaptedShow: (): void => {
      dispatch(saveAdaptedShow());
    },
    setDronesVisible: (value: boolean): void => {
      dispatch(setDronesVisible(value));
    },
  })
)(withTranslation()(SiteSurveyDialogWrapper));

export default ConnectedSiteSurveyDialogWrapper;
