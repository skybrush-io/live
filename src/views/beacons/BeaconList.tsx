/**
 * @file Component that displays the status of the known docking stations.
 */

import Search from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { connect } from 'react-redux';

import { Status } from '@skybrush/app-theme-mui';
import { StatusLight, Tooltip } from '@skybrush/mui-components';

import {
  multiSelectableListOf,
  type MultiSelectableListProps,
} from '~/components/helpers/lists';
import { setSelectedBeaconIds } from '~/features/beacons/actions';
import {
  getBeaconDisplayName,
  getBeaconsInOrder,
  getSelectedBeaconIds,
} from '~/features/beacons/selectors';
import type { Beacon } from '~/features/beacons/types';
import type { RootState } from '~/store/reducers';
import { scrollToMapLocation } from '~/signals';

type BeaconListPresentationProps = MultiSelectableListProps & {
  dense?: boolean;
};

/**
 * Presentation component for the entire dock list.
 */
const BeaconListPresentation = multiSelectableListOf<
  Beacon,
  BeaconListPresentationProps
>(
  (beacon, props, selected) => {
    const rightIconButton = beacon.position ? (
      <Tooltip content='Show on map'>
        <IconButton
          edge='end'
          size='large'
          onClick={() => scrollToMapLocation(beacon.position!)}
        >
          <Search />
        </IconButton>
      </Tooltip>
    ) : null;

    return (
      <ListItem disablePadding secondaryAction={rightIconButton}>
        <ListItemButton
          key={beacon.id}
          className={selected ? 'selected-list-item' : undefined}
          onClick={props.onItemSelected}
        >
          <StatusLight status={beacon.active ? Status.SUCCESS : Status.ERROR} />
          <ListItemText primary={getBeaconDisplayName(beacon)} />
        </ListItemButton>
      </ListItem>
    );
  },
  {
    backgroundHint: 'No beacons',
    dataProvider: 'beacons',
  }
);

type Props = Omit<
  BeaconListPresentationProps,
  'value' | 'onChange' | 'onActivate'
> & {
  beacons?: Beacon[];
  onItemActivated?: (id: string) => void;
  onSelectionChanged?: (ids: string[]) => void;
  selectedIds?: string[];
};

/**
 * React component that shows the state of the known beacons in a Skybrush
 * server.
 */
const BeaconList = ({
  onItemActivated,
  onSelectionChanged,
  selectedIds,
  ...rest
}: Props) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <BeaconListPresentation
        dense
        value={selectedIds || []}
        onActivate={onItemActivated}
        onChange={onSelectionChanged}
        {...rest}
      />
    </Box>
  </Box>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    beacons: getBeaconsInOrder(state),
    selectedIds: getSelectedBeaconIds(state),
  }),
  // mapDispatchToProps
  {
    // onItemActivated: openDockDetailsDialog,
    onSelectionChanged: setSelectedBeaconIds,
  }
)(BeaconList);
