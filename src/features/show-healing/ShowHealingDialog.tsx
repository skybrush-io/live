import ArrowBack from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import SwapDroneField from '~/features/uavs/swapping/SwapDroneField';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { confirmShowHealing, requestShowHealing } from './actions';
import {
  canRequestShowHealing,
  getShowHealingFieldTexts,
  getShowHealingProblemKey,
  getShowHealingReplacementCandidates,
  getShowHealingResult,
  isShowHealingDialogOpen,
  shouldAutoConfirmShowHealing,
} from './selectors';
import {
  closeShowHealingDialog,
  setShowHealingAutoConfirm,
  setShowHealingFieldText,
  type ShowHealingResult,
} from './slice';
import ShowHealingStatus from './ShowHealingStatus';
import type { ShowHealingField } from './types';

type StateProps = {
  autoConfirm: boolean;
  canRequest: boolean;
  fieldTexts: Record<ShowHealingField, string>;
  open: boolean;
  problemKey: string | null;
  replacementCandidates: Identifier[];
  result: ShowHealingResult;
};

type DispatchProps = {
  onClose: () => void;
  onConfirm: () => void;
  onRequest: () => void;
  onSetAutoConfirm: (autoConfirm: boolean) => void;
  onSetFieldText: (payload: { field: ShowHealingField; text: string }) => void;
};

type Props = DispatchProps & StateProps;

/**
 * Dialog for replacing a drone of the running show with a drone that is not
 * part of the show yet, using a trajectory calculated by the server.
 */
const ShowHealingDialog = ({
  autoConfirm,
  canRequest,
  fieldTexts,
  onClose,
  onConfirm,
  onRequest,
  onSetAutoConfirm,
  onSetFieldText,
  open,
  problemKey,
  replacementCandidates,
  result,
}: Props) => {
  const { t } = useTranslation();
  const replacementFieldRef = useRef<HTMLInputElement>(null);
  const healButtonRef = useRef<HTMLButtonElement>(null);
  const isReady = result.status === 'ready';

  return (
    <DraggableDialog
      maxWidth='md'
      open={open}
      title={t('showHealingDialog.title')}
      onClose={onClose}
    >
      <DialogContent>
        <Stack direction='row' spacing={1} alignItems='center'>
          <SwapDroneField
            autoFocus
            label={t('showHealingDialog.slotLabel')}
            side='left'
            useMissionIds
            value={fieldTexts.slot}
            onCancel={onClose}
            onChange={(text) => {
              onSetFieldText({ field: 'slot', text });
            }}
            onSubmit={() => {
              replacementFieldRef.current?.focus();
            }}
          />
          <ArrowBack />
          <SwapDroneField
            inputRef={replacementFieldRef}
            label={t('showHealingDialog.replacementLabel')}
            side='right'
            uavIds={replacementCandidates}
            useMissionIds={false}
            value={fieldTexts.replacement}
            onCancel={onClose}
            onChange={(text) => {
              onSetFieldText({ field: 'replacement', text });
            }}
            onSubmit={() => {
              // Deferred until the new field value has been rendered, as the
              // button cannot receive focus while it is disabled
              setTimeout(() => {
                healButtonRef.current?.focus();
              }, 0);
            }}
          />
        </Stack>

        <Box sx={{ pt: 2, minHeight: 80 }}>
          <ShowHealingStatus problemKey={problemKey} result={result} />
        </Box>
      </DialogContent>
      <DialogActions>
        <FormControlLabel
          label={t('showHealingDialog.autoConfirm')}
          control={
            <Checkbox
              checked={autoConfirm}
              onChange={(event) => {
                onSetAutoConfirm(event.target.checked);
              }}
            />
          }
          sx={{ ml: 0.5 }}
        />
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t('general.action.cancel')}</Button>
        {isReady ? (
          <Button color='primary' onClick={onConfirm}>
            {t('showHealingDialog.action.confirm')}
          </Button>
        ) : (
          <Button
            ref={healButtonRef}
            color='primary'
            disabled={!canRequest}
            onClick={onRequest}
          >
            {t('showHealingDialog.action.heal')}
          </Button>
        )}
      </DialogActions>
    </DraggableDialog>
  );
};

export default connect(
  (state: RootState): StateProps => ({
    autoConfirm: shouldAutoConfirmShowHealing(state),
    canRequest: canRequestShowHealing(state),
    fieldTexts: getShowHealingFieldTexts(state),
    open: isShowHealingDialogOpen(state),
    problemKey: getShowHealingProblemKey(state),
    replacementCandidates: getShowHealingReplacementCandidates(state),
    result: getShowHealingResult(state),
  }),
  {
    onClose: closeShowHealingDialog,
    onConfirm: confirmShowHealing,
    onRequest: requestShowHealing,
    onSetAutoConfirm: setShowHealingAutoConfirm,
    onSetFieldText: setShowHealingFieldText,
  }
)(ShowHealingDialog);
