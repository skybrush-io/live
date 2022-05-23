import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import SmallToolbarSwitch from '~/components/SmallToolbarSwitch';

const BroadcastSwitch = ({ checked, setChecked, timeout, ...rest }) => {
  useEffect(() => {
    let timer;

    if (checked && typeof timeout === 'number' && timeout > 0) {
      timer = setTimeout(() => {
        setChecked(false);
      }, timeout * 1000);
    }

    return timer
      ? () => {
          clearTimeout(timer);
        }
      : null;
  }, [checked, setChecked, timeout]);

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
