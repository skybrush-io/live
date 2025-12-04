import Delete from '@mui/icons-material/Delete';
import Redo from '@mui/icons-material/Redo';
import Undo from '@mui/icons-material/Undo';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import { type TooltipProps } from '@skybrush/mui-components/lib/Tooltip';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

type UndoRedoButtonsProps = Readonly<{
  canDiscard: boolean;
  canRedo: boolean;
  canUndo: boolean;
  discard: () => void;
  redo: () => void;
  tooltipPlacement: TooltipProps['placement'];
  undo: () => void;
}> &
  WithTranslation;

const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
  canDiscard,
  canRedo,
  canUndo,
  discard,
  redo,
  t,
  tooltipPlacement,
  undo,
}) => (
  <>
    <Tooltip content={t('general.action.discard')} placement={tooltipPlacement}>
      <IconButton disabled={!canDiscard} size='large' onClick={discard}>
        <Delete />
      </IconButton>
    </Tooltip>
    <Tooltip content={t('general.action.undo')} placement={tooltipPlacement}>
      <IconButton disabled={!canUndo} size='large' onClick={undo}>
        <Undo />
      </IconButton>
    </Tooltip>
    <Tooltip content={t('general.action.redo')} placement={tooltipPlacement}>
      <IconButton disabled={!canRedo} size='large' onClick={redo}>
        <Redo />
      </IconButton>
    </Tooltip>
  </>
);

export default withTranslation()(UndoRedoButtons);
