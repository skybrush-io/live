import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Tooltip } from '@skybrush/mui-components';

import ContentCopy from '~/icons/ContentCopy';

import {
  copyAntennaPositionToClipboard,
  toggleAntennaPositionFormat,
} from './actions';
import { getAntennaInfoSummary } from './selectors';

const AntennaPositionIndicator = ({
  onCopyAntennaPositionToClipboard,
  onClick,
  position,
  t,
}) => {
  const hasAntennaPosition = Boolean(position);

  return (
    <>
      <Tooltip content={t('antennaPositionIndicator.clickToToggle')}>
        <Typography
          variant='body2'
          component='div'
          color={hasAntennaPosition ? 'textPrimary' : 'textSecondary'}
          style={{ cursor: 'pointer', textAlign: 'right' }}
          onClick={onClick}
        >
          {position || t('antennaPositionIndicator.antennaPositionNotKnown')}
        </Typography>
      </Tooltip>
      {onCopyAntennaPositionToClipboard && (
        <Tooltip content={t('antennaPositionIndicator.copyToClipboard')}>
          <IconButton
            disabled={!hasAntennaPosition}
            size='large'
            onClick={onCopyAntennaPositionToClipboard}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

AntennaPositionIndicator.propTypes = {
  // description: PropTypes.string,
  position: PropTypes.string,
  onClick: PropTypes.func,
  onCopyAntennaPositionToClipboard: PropTypes.func,
  t: PropTypes.func,
};

export default connect(getAntennaInfoSummary, {
  onClick: toggleAntennaPositionFormat,
  onCopyAntennaPositionToClipboard: copyAntennaPositionToClipboard,
})(withTranslation()(AntennaPositionIndicator));
