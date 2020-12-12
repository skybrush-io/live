import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import Tooltip from '~/components/Tooltip';
import ContentCopy from '~/icons/ContentCopy';

import { copyAntennaPositionToClipboard } from './actions';
import { getAntennaInfoSummary } from './selectors';

const AntennaPositionIndicator = ({
  onCopyAntennaPositionToClipboard,
  position,
}) => {
  const hasAntennaPosition = Boolean(position);

  return (
    <>
      <Typography
        variant='body2'
        component='div'
        color={hasAntennaPosition ? 'textPrimary' : 'textSecondary'}
      >
        {position || 'Antenna position not known'}
      </Typography>
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
  onCopyAntennaPositionToClipboard: PropTypes.func,
};

export default connect(getAntennaInfoSummary, {
  onCopyAntennaPositionToClipboard: copyAntennaPositionToClipboard,
})(AntennaPositionIndicator);
