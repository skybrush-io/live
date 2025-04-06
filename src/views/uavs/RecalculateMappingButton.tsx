import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Button, { type ButtonProps } from '@material-ui/core/Button';

import { recalculateMapping } from '~/features/mission/actions';
import { hasNonemptyMappingSlot } from '~/features/mission/selectors';
import AutoFix from '~/icons/AutoFix';
import type { AppDispatch } from '~/store/reducers';

type RecalculateMappingButtonProps = Omit<ButtonProps, 'onClick'>;

/**
 * Button that allows the user to recalculate the current mapping from scratch
 * based on the current positions of the drones and their takeoff positions.
 */
const RecalculateMappingButton = (
  props: RecalculateMappingButtonProps
): JSX.Element => {
  const { t } = useTranslation();
  const hasNonempty = useSelector(hasNonemptyMappingSlot);
  const dispatch: AppDispatch = useDispatch();
  return (
    <Button
      startIcon={<AutoFix />}
      onClick={() => {
        dispatch(recalculateMapping() as any);
      }}
      {...props}
    >
      {hasNonempty
        ? t('recalculateMappingButton.recalculateMapping')
        : t('recalculateMappingButton.findOptimalMapping')}
    </Button>
  );
};

export default RecalculateMappingButton;
