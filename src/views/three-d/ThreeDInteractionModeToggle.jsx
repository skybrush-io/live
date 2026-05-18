import Visibility from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import { Tooltip } from '@skybrush/mui-components';

import ToggleButton from '~/components/ToggleButton';
import Route from '~/icons/Route';

const ThreeDInteractionModeTogglePresentation = ({ mode, onChange, t }) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={mode}
    aria-label={t('threeDInteractionMode.label')}
  >
    <Tooltip content={t('threeDInteractionMode.viewTooltip')}>
      <ToggleButton
        selected={mode === 'view'}
        value="view"
        aria-label={t('threeDInteractionMode.view')}
        onClick={() => onChange('view')}
      >
        <Box
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Visibility fontSize="small" />
          {t('threeDInteractionMode.view')}
        </Box>
      </ToggleButton>
    </Tooltip>
    <Tooltip content={t('threeDInteractionMode.createTooltip')}>
      <ToggleButton
        selected={mode === 'create'}
        value="create"
        aria-label={t('threeDInteractionMode.create')}
        onClick={() => onChange('create')}
      >
        <Box
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <Route fontSize="small" />
          {t('threeDInteractionMode.create')}
        </Box>
      </ToggleButton>
    </Tooltip>
  </ToggleButtonGroup>
);

ThreeDInteractionModeTogglePresentation.propTypes = {
  mode: PropTypes.oneOf(['view', 'create']).isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation()(ThreeDInteractionModeTogglePresentation);
