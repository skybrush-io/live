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

import { Tooltip } from '@skybrush/mui-components';

import {
  multiSelectableListOf,
  type MultiSelectableListProps,
} from '~/components/helpers/lists';
import { setSelectedDockIds } from '~/features/docks/actions';
import { openDockDetailsDialog } from '~/features/docks/details';
import {
  getDocksInOrder,
  getSelectedDockIds,
} from '~/features/docks/selectors';
import type { DockState } from '~/features/docks/types';
import type { RootState } from '~/store/reducers';
import { scrollToMapLocation } from '~/signals';

type DockListPresentationProps = MultiSelectableListProps & {
  dense?: boolean;
};

/**
 * Presentation component for the entire dock list.
 */
const DockListPresentation = multiSelectableListOf<
  DockState,
  DockListPresentationProps
>(
  (dock, props, selected) => {
    const rightIconButton = dock.position ? (
      <Tooltip content='Show on map'>
        <IconButton
          edge='end'
          size='large'
          onClick={() => scrollToMapLocation(dock.position!)}
        >
          <Search />
        </IconButton>
      </Tooltip>
    ) : null;

    return (
      <ListItem disablePadding secondaryAction={rightIconButton}>
        <ListItemButton
          key={dock.id}
          className={selected ? 'selected-list-item' : undefined}
          onClick={props.onItemSelected}
        >
          <ListItemText primary={dock.id} />
        </ListItemButton>
      </ListItem>
    );
  },
  {
    backgroundHint: 'No docking stations',
    dataProvider: 'docks',
  }
);

type Props = Omit<
  DockListPresentationProps,
  'value' | 'onChange' | 'onActivate'
> & {
  docks?: DockState[];
  onItemActivated?: (id: string) => void;
  onSelectionChanged?: (ids: string[]) => void;
  selectedIds?: string[];
};

/**
 * React component that shows the state of the known docks in a Skybrush
 * server.
 */
const DockList = ({
  onItemActivated,
  onSelectionChanged,
  selectedIds,
  ...rest
}: Props) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <DockListPresentation
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
    docks: getDocksInOrder(state),
    selectedIds: getSelectedDockIds(state),
  }),
  // mapDispatchToProps
  {
    onItemActivated: openDockDetailsDialog,
    onSelectionChanged: setSelectedDockIds,
  }
)(DockList);
