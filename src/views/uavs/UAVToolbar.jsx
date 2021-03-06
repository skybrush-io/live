import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import ImageBlurCircular from '@material-ui/icons/BlurCircular';
import ImageBlurOn from '@material-ui/icons/BlurOn';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';

import BroadcastSwitch from './BroadcastSwitch';
import MappingButtonGroup from './MappingButtonGroup';

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = React.forwardRef(
  ({ fitSelectedUAVs, selectedUAVIds, ...rest }, ref) => {
    const [broadcast, setBroadcast] = useState(false);
    const isSelectionEmpty = isEmpty(selectedUAVIds);

    return (
      <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
        <Box width={4} />

        <BroadcastSwitch
          checked={broadcast}
          setChecked={setBroadcast}
          timeout={5}
        />
        <UAVOperationsButtonGroup
          startSeparator
          broadcast={broadcast}
          selectedUAVIds={selectedUAVIds}
        />

        <Box flex={1} />

        {fitSelectedUAVs && (
          <Tooltip
            content={
              isSelectionEmpty
                ? 'Fit all features into view'
                : 'Fit selection into view'
            }
          >
            <IconButton style={{ float: 'right' }} onClick={fitSelectedUAVs}>
              {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
            </IconButton>
          </Tooltip>
        )}

        <MappingButtonGroup />
      </Toolbar>
    );
  }
);

UAVToolbar.propTypes = {
  fitSelectedUAVs: PropTypes.func,
  selectedUAVIds: PropTypes.array,
};

export default UAVToolbar;
