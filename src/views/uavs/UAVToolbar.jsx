import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import ImageBlurCircular from '@material-ui/icons/BlurCircular';
import ImageBlurOn from '@material-ui/icons/BlurOn';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';

import BroadcastSwitch from './BroadcastSwitch';
import MappingButtonGroup from './MappingButtonGroup';

import { setBroadcast } from '~/features/session/slice';
import { isBroadcast } from '~/features/session/selectors';

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = React.forwardRef(
  (
    { fitSelectedUAVs, isBroadcast, selectedUAVIds, setBroadcast, ...rest },
    ref
  ) => {
    const isSelectionEmpty = isEmpty(selectedUAVIds);

    return (
      <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
        <Box width={4} />

        <BroadcastSwitch
          checked={isBroadcast}
          setChecked={setBroadcast}
          timeout={5}
        />
        <UAVOperationsButtonGroup
          startSeparator
          broadcast={isBroadcast}
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
  isBroadcast: PropTypes.bool,
  selectedUAVIds: PropTypes.array,
  setBroadcast: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isBroadcast: isBroadcast(state),
  }),
  // mapDispatchToProps
  {
    setBroadcast,
  }
)(UAVToolbar);
