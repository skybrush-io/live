import React from 'react';
// TODO: Sort order when only case differs???
import { type WithTranslation, withTranslation } from 'react-i18next';

import IconButton from '@material-ui/core/IconButton';

import Redo from '@material-ui/icons/Redo';
import Undo from '@material-ui/icons/Undo';

import { type TooltipProps } from '@skybrush/mui-components/lib/Tooltip';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

// TODO: Figure out DispatchActionWithoutPayload or whatever instead of `() => void`!

type UndoRedoButtonsProps = Readonly<{
  canRedo: boolean;
  canUndo: boolean;
  redo: () => void;
  undo: () => void;
  tooltipPlacement: TooltipProps['placement'];
}> &
  WithTranslation;

const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
  canRedo,
  canUndo,
  redo,
  t,
  tooltipPlacement,
  undo,
}) => (
  <>
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
