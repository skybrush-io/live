import PropTypes from 'prop-types';
import React from 'react';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import SmallToolbarSwitch from '~/components/SmallToolbarSwitch';

const BroadcastSwitch = ({ checked, setChecked, timeout, ...rest }) => {
  return (
    <Tooltip
      content={
        timeout
          ? `Broadcast mode for next ${timeout} seconds`
          : 'Broadcast mode'
      }
    >
      <SmallToolbarSwitch
        checked={checked}
        color='primary'
        label='BCAST'
        labelColor={checked ? 'primary' : 'textSecondary'}
        onChange={(event) => setChecked(event.target.checked)}
        {...rest}
      />
    </Tooltip>
  );
};

BroadcastSwitch.propTypes = {
  checked: PropTypes.bool,
  setChecked: PropTypes.func.isRequired,
  timeout: PropTypes.number,
};

export default BroadcastSwitch;
