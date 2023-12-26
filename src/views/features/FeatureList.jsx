/**
 * @file Component that shows the list of features created by the user.
 */

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';

import Delete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import FilterCenterFocus from '@material-ui/icons/FilterCenterFocus';
import MoreVert from '@material-ui/icons/MoreVert';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { listOf } from '~/components/helpers/lists';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  addToSelection,
  removeFromSelection,
  setSelection,
  toggleInSelection,
} from '~/features/map/selection';
import { showFeatureEditorDialog } from '~/features/map-features/actions';
import {
  getFeaturesByIds,
  getFeaturesInOrder,
  getSelectedFeatureIds,
} from '~/features/map-features/selectors';
import {
  removeFeaturesByIds,
  updateFeatureVisibility,
} from '~/features/map-features/slice';
import useDropdown from '~/hooks/useDropdown';
import { getNameOfFeatureType, getIconOfFeatureType } from '~/model/features';
import { featureIdToGlobalId } from '~/model/identifiers';
import { fitCoordinatesIntoMapView } from '~/signals';

const ICON_SIZE = 24;
const GAP_SIZE = 12;

const useStyles = makeStyles(
  {
    container: {
      containerType: 'inline-size',
    },
    item: {
      '@container (min-width: 351px)': {
        paddingRight: (props) =>
          ICON_SIZE * props.actions.length +
          GAP_SIZE * (props.actions.length + 1),
      },
    },
    button: {
      '@container (max-width: 350px)': {
        display: 'none',
      },
    },
    menu: {
      '@container (min-width: 351px)': {
        display: 'none',
      },
    },
  },
  {
    name: 'FeatureList',
  }
);

/**
 * Presentation component for a single entry in the feature list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const FeatureListEntry = (props) => {
  const {
    feature,
    onEditFeature,
    onFocusFeature,
    onRemoveFeature,
    onSelectFeature,
    onToggleFeatureVisibility,
    selected,
  } = props;
  const { id, color, label, type, visible } = feature;

  const IconOfFeatureType = getIconOfFeatureType(type);

  const actions = [
    {
      action: onFocusFeature,
      icon: <FilterCenterFocus />,
      key: 'focus',
      label: 'Focus feature',
    },
    {
      action: onToggleFeatureVisibility,
      icon: visible ? <Visibility /> : <VisibilityOff color='disabled' />,
      key: 'visibility',
      label: 'Toggle visibility',
    },
    {
      action: onEditFeature,
      icon: <Edit />,
      key: 'edit',
      label: 'Feature properties',
    },
    {
      action: onRemoveFeature,
      icon: <Delete />,
      key: 'delete',
      label: 'Remove',
    },
  ];

  const classes = useStyles({ actions });

  const actionButtons = (
    <>
      {actions.map(({ action, icon, key, label }) => (
        <Tooltip key={key} content={label}>
          <IconButton
            className={classes.button}
            edge='end'
            data-id={id}
            onClick={action}
          >
            {icon}
          </IconButton>
        </Tooltip>
      ))}
    </>
  );

  const [menuAnchorElement, openMenu, closeMenu] = useDropdown();
  const actionMenu = (
    <>
      <IconButton className={classes.menu} edge='end' onClick={openMenu}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={menuAnchorElement}
        open={menuAnchorElement !== null}
        variant='menu'
        onClose={closeMenu}
      >
        {actions.map(({ action, icon, key, label }) => (
          <MenuItem key={key} data-id={id} onClick={closeMenu(action)}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return (
    <ListItem
      button
      ContainerProps={{ className: classes.container }}
      className={classes.item}
      selected={selected}
      data-id={id}
      onClick={onSelectFeature}
    >
      <ListItemIcon style={{ color, minWidth: 0, marginRight: '16px' }}>
        <IconOfFeatureType />
      </ListItemIcon>
      {label ? (
        <ListItemText style={{ overflowWrap: 'break-word' }} primary={label} />
      ) : (
        <ListItemText secondary={getNameOfFeatureType(type)} />
      )}
      <ListItemSecondaryAction>
        {actionButtons}
        {actionMenu}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

FeatureListEntry.propTypes = {
  onEditFeature: PropTypes.func,
  onFocusFeature: PropTypes.func,
  onRemoveFeature: PropTypes.func,
  onSelectFeature: PropTypes.func,
  onToggleFeatureVisibility: PropTypes.func,
  feature: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};

/**
 * Presentation component for the entire feature list.
 */
export const FeatureListPresentation = listOf(
  (
    feature,
    {
      onEditFeature,
      onFocusFeature,
      onRemoveFeature,
      onSelectFeature,
      onToggleFeatureVisibility,
      selectedFeatureIds,
    }
  ) => {
    return (
      <FeatureListEntry
        key={feature.id}
        feature={feature}
        selected={selectedFeatureIds.includes(feature.id)}
        onEditFeature={onEditFeature}
        onFocusFeature={onFocusFeature}
        onRemoveFeature={onRemoveFeature}
        onSelectFeature={onSelectFeature}
        onToggleFeatureVisibility={onToggleFeatureVisibility}
      />
    );
  },
  {
    dataProvider: 'features',
    backgroundHint: 'No features',
  }
);
FeatureListPresentation.displayName = 'FeatureListPresentation';

export default connect(
  // mapStateToProps
  (state) => ({
    dense: true,
    features: getFeaturesInOrder(state),
    featuresByIds: getFeaturesByIds(state),
    selectedFeatureIds: getSelectedFeatureIds(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onEditFeature(event) {
      const featureId = event.currentTarget.dataset.id;
      if (featureId) {
        dispatch(showFeatureEditorDialog(featureId));
      }
    },
    onRemoveFeature(event) {
      const featureId = event.currentTarget.dataset.id;
      if (featureId) {
        dispatch(removeFeaturesByIds([featureId]));
      }
    },
    onSelectFeature(event) {
      const featureId = event.currentTarget.dataset.id;
      // prettier-ignore
      const action
        = event.shiftKey ? addToSelection
        : event.altKey ? removeFromSelection
        : event.ctrlKey || event.metaKey ? toggleInSelection
        : setSelection;

      if (featureId) {
        dispatch(action([featureIdToGlobalId(featureId)]));
      }
    },
    onSetFeatureVisibility(event, visible) {
      const featureId = event.currentTarget.dataset.id;
      if (featureId) {
        dispatch(updateFeatureVisibility({ id: featureId, visible }));
      }
    },
  }),
  // mergeProps
  (
    { featuresByIds, ...stateProps },
    { onSetFeatureVisibility, ...dispatchProps },
    ownProps
  ) => ({
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    onFocusFeature(event) {
      const featureId = event.currentTarget.dataset.id;
      if (featureId) {
        fitCoordinatesIntoMapView(featuresByIds[featureId].points);
      }
    },
    onToggleFeatureVisibility(event) {
      const featureId = event.currentTarget.dataset.id;
      if (featureId) {
        onSetFeatureVisibility(event, !featuresByIds[featureId].visible);
      }
    },
  })
)(FeatureListPresentation);
