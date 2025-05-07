import React from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import IconButton from '@material-ui/core/IconButton';

import Delete from '@material-ui/icons/Delete';
import Redo from '@material-ui/icons/Redo';
import Undo from '@material-ui/icons/Undo';

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
      <IconButton disabled={!canDiscard} onClick={discard}>
        <Delete />
      </IconButton>
    </Tooltip>
    <Tooltip content={t('general.action.undo')} placement={tooltipPlacement}>
      <IconButton disabled={!canUndo} onClick={undo}>
        <Undo />
      </IconButton>
    </Tooltip>
    <Tooltip content={t('general.action.redo')} placement={tooltipPlacement}>
      <IconButton disabled={!canRedo} onClick={redo}>
        <Redo />
      </IconButton>
    </Tooltip>
  </>
);

export default withTranslation()(UndoRedoButtons);
