/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import makeStyles from '@material-ui/core/styles/makeStyles';

import DroneAvatar from './DroneAvatar';
import DroneListItem from './DroneListItem';

import { setSelectedUAVIds } from '~/actions/map';
import { createSelectionHandlerFactory } from '~/components/helpers/lists';
import { getUAVIdList } from '~/features/uavs/selectors';
import useDarkMode from '~/hooks/useDarkMode';
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

const useStyles = makeStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.background.paper
    },
    rootDark: {
      backgroundColor: theme.palette.primary.main
    }
  }),
  { name: 'UAVList' }
);

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  onSelectionChanged,
  selectedUAVIds,
  uavIds
}) => {
  const classes = useStyles();
  const darkMode = useDarkMode();
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
      <AppBar
        color="default"
        position="static"
        className={darkMode ? classes.rootDark : classes.root}
      >
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

UAVListPresentation.propTypes = {
  onSelectionChanged: PropTypes.func,
  selectedUAVIds: PropTypes.array,
  uavIds: PropTypes.array
};

/**
 * Smart component for showing the drone show configuration view.
 */
const UAVList = connect(
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
)(UAVListPresentation);

export default UAVList;
