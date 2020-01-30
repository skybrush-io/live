/**
 * @file Component that displays the list datasets.
 */

import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';

import DroneAvatar from './DroneAvatar';
import DroneListItem from './DroneListItem';

import { setSelectedUAVIds } from '~/actions/map';
import { createSelectionHandlerFactory } from '~/components/helpers/lists';
import { getUAVIdList } from '~/features/uavs/selectors';
import { getSelectedUAVIds } from '~/selectors/selection';
import UAVToolbar from '~/views/uavs/UAVToolbar';

const drones = [
  {
    id: '1',
    progress: 30,
    status: 'success',
    secondaryStatus: 'off',
    text: 'Armed',
    textSemantics: 'success'
  },
  {
    id: '2',
    crossed: true,
    status: 'rth'
  },
  {
    id: '3',
    status: 'warning'
  },
  {
    id: '4',
    status: 'error'
  },
  {
    id: '5',
    status: 'critical'
  }
];

/**
 * Presentation component for showing the drone show configuration view.
 */
const ConfigurationViewPresentation = ({
  onSelectionChanged,
  selectedUAVIds,
  uavIds
}) => {
  const onSelected = useMemo(
    () =>
      createSelectionHandlerFactory({
        getSelection: () => selectedUAVIds,
        setSelection: onSelectionChanged
      }),
    [selectedUAVIds, onSelectionChanged]
  );

  return (
    <Box display="flex" flexDirection="column">
      <AppBar color="default" position="static">
        <UAVToolbar flex={0} selectedUAVIds={selectedUAVIds} />
      </AppBar>
      <Box display="flex" flex={1} flexDirection="row" flexWrap="wrap">
        {uavIds.map(uavId => (
          <DroneListItem
            key={uavId}
            selected={selectedUAVIds.includes(uavId)}
            onClick={onSelected(uavId)}
          >
            <DroneAvatar
              key={uavId}
              id={uavId}
              selected={selectedUAVIds.includes(uavId)}
            />
          </DroneListItem>
        ))}
      </Box>
    </Box>
  );
};

ConfigurationViewPresentation.propTypes = {
  onSelectionChanged: PropTypes.func,
  selectedUAVIds: PropTypes.array,
  uavIds: PropTypes.array
};

/**
 * Smart component for showing the drone show configuration view.
 */
const ConfigurationView = connect(
  // mapStateToProps
  state => ({
    selectedUAVIds: getSelectedUAVIds(state),
    uavIds: getUAVIdList(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onSelectionChanged: uavIds => {
      dispatch(setSelectedUAVIds(uavIds));
    }
  })
)(ConfigurationViewPresentation);

export default ConfigurationView;
