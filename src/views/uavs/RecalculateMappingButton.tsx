import type { TFunction } from 'i18next';
import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import Button, { type ButtonProps } from '@material-ui/core/Button';

import { recalculateMapping } from '~/features/mission/actions';
import { hasNonemptyMappingSlot } from '~/features/mission/selectors';
import AutoFix from '~/icons/AutoFix';
import type { RootState } from '~/store/reducers';

type RecalculateMappingButtonProps = ButtonProps &
  Readonly<{
    hasNonemptyMappingSlot: boolean;
    t: TFunction;
  }>;

/**
 * Button that allows the user to recalculate the current mapping from scratch
 * based on the current positions of the drones and their takeoff positions.
 */
const RecalculateMappingButton = ({
  hasNonemptyMappingSlot,
  t,
  ...rest
}: RecalculateMappingButtonProps): JSX.Element => (
  <Button startIcon={<AutoFix />} {...rest}>
    {hasNonemptyMappingSlot
      ? t('recalculateMappingButton.recalculateMapping')
      : t('recalculateMappingButton.findOptimalMapping')}
  </Button>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    hasNonemptyMappingSlot: hasNonemptyMappingSlot(state),
  }),
  // mapDispatchToProps
  {
    onClick: recalculateMapping,
  }
)(withTranslation()(RecalculateMappingButton));
