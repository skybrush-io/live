import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

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
}) => {
  const hasAntennaPosition = Boolean(position);

  return (
    <>
      <Tooltip content='Click to toggle between lon/lat and ECEF format'>
        <Typography
          variant='body2'
          component='div'
          color={hasAntennaPosition ? 'textPrimary' : 'textSecondary'}
          style={{ cursor: 'pointer', textAlign: 'right' }}
          onClick={onClick}
        >
          {position || 'Antenna position not known'}
        </Typography>
      </Tooltip>
      {onCopyAntennaPositionToClipboard && (
        <Tooltip content='Copy to clipboard'>
          <IconButton
            disabled={!hasAntennaPosition}
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
};

export default connect(getAntennaInfoSummary, {
  onClick: toggleAntennaPositionFormat,
  onCopyAntennaPositionToClipboard: copyAntennaPositionToClipboard,
})(AntennaPositionIndicator);
