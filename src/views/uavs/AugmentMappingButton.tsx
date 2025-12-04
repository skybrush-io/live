import Shuffle from '@mui/icons-material/Shuffle';
import Button, { type ButtonProps } from '@mui/material/Button';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';

import { augmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/actions';
import { canAugmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/selectors';
import type { AppDispatch } from '~/store/reducers';

type AugmentMappingButtonProps = Omit<ButtonProps, 'onClick'>;

/**
 * Button that allows the user to augment the current mapping with spare
 * drones based on their current positions automatically.
 */
const AugmentMappingButton = (props: AugmentMappingButtonProps) => {
  const { t } = useTranslation();
  const dispatch: AppDispatch = useDispatch();
  const canAugmentMapping = useSelector(
    canAugmentMappingAutomaticallyFromSpareDrones
  );
  return (
    <Button
      startIcon={<Shuffle />}
      disabled={!canAugmentMapping}
      onClick={() => {
        dispatch(augmentMappingAutomaticallyFromSpareDrones());
      }}
      {...props}
    >
      {t('augmentMappingButton.assignSparesToEmptySlots')}
    </Button>
  );
};

export default AugmentMappingButton;
