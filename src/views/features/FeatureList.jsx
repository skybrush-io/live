/**
 * @file Component that shows the list of features created by the user.
 */

import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';

import Delete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import FilterCenterFocus from '@material-ui/icons/FilterCenterFocus';
import MoreVert from '@material-ui/icons/MoreVert';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import { bindActionCreators } from '@reduxjs/toolkit';

import {
  createSelectionHandlerThunk,
  listOf,
} from '~/components/helpers/lists';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  setSelectedFeatureIds,
  showFeatureEditorDialog,
  toggleFeatureVisibility,
} from '~/features/map-features/actions';
import {
  getFeatureIds,
  getFeaturesInOrder,
  getSelectedFeatureIds,
} from '~/features/map-features/selectors';
import {
  shouldFillFeature,
  suggestedColorForFeature,
  suggestedLabelForFeature,
} from '~/features/map-features/selectors-style-suggestions';
import { removeFeaturesByIds } from '~/features/map-features/slice';
import useDropdown from '~/hooks/useDropdown';
import { FeatureType, getIconOfFeatureType } from '~/model/features';
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
const FeatureListEntryPresentation = (props) => {
  const {
    feature,
    onEdit,
    onRemove,
    onSelect,
    onToggleVisibility,
    selected,
    shouldFill,
    suggestedColor,
    suggestedLabel,
  } = props;
  const onFocus = useCallback(() => {
    switch (feature.type) {
      case FeatureType.CIRCLE:
        // TODO: Properly handle circles instead of zooming to the
        //       center and one arbitrary point on the circumference
        fitCoordinatesIntoMapView(feature.points);
        break;

      default:
        fitCoordinatesIntoMapView(feature.points);
        break;
    }
  }, [feature.points, feature.type]);

  const { label, type, visible } = feature;
  const IconOfFeatureType = getIconOfFeatureType(type, shouldFill);

  const actions = [
    {
      action: onFocus,
      icon: <FilterCenterFocus />,
      key: 'focus',
      label: 'Focus feature',
    },
    {
      action: onToggleVisibility,
      icon: visible ? <Visibility /> : <VisibilityOff color='disabled' />,
      key: 'visibility',
      label: 'Toggle visibility',
    },
    {
      action: onEdit,
      icon: <Edit />,
      key: 'edit',
      label: 'Feature properties',
    },
    {
      action: onRemove,
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
          <IconButton className={classes.button} edge='end' onClick={action}>
            {icon}
          </IconButton>
        </Tooltip>
      ))}
    </>
  );

  const [menuAnchorElement, openMenu, closeMenu, closeMenuWith] = useDropdown();
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
          <MenuItem key={key} onClick={closeMenuWith(action)}>
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
      onClick={onSelect}
    >
      <ListItemIcon
        style={{ color: suggestedColor, minWidth: 0, marginRight: '16px' }}
      >
        <IconOfFeatureType />
      </ListItemIcon>
      {label ? (
        <ListItemText style={{ overflowWrap: 'break-word' }} primary={label} />
      ) : (
        <ListItemText secondary={suggestedLabel} />
      )}
      <ListItemSecondaryAction>
        {actionButtons}
        {actionMenu}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

FeatureListEntryPresentation.propTypes = {
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  onSelect: PropTypes.func,
  onToggleVisibility: PropTypes.func,
  feature: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  shouldFill: PropTypes.bool,
  suggestedColor: PropTypes.string,
  suggestedLabel: PropTypes.string,
};

const FeatureListEntry = connect(
  // mapStateToProps
  (state, { feature }) => ({
    selected: getSelectedFeatureIds(state).includes(feature.id),
    shouldFill: shouldFillFeature(state, feature.id),
    suggestedColor: suggestedColorForFeature(state, feature.id),
    suggestedLabel: suggestedLabelForFeature(state, feature.id),
  }),
  // mapDispatchToProps
  (dispatch, { feature }) => {
    const selectionHandlerThunk = createSelectionHandlerThunk({
      activateItem: showFeatureEditorDialog,
      getSelection: getSelectedFeatureIds,
      setSelection: setSelectedFeatureIds,
      getListItems: getFeatureIds,
    });

    return () => ({
      ...bindActionCreators(
        {
          onEdit: showFeatureEditorDialog.bind(null, feature.id),
          onSelect: selectionHandlerThunk.bind(null, feature.id),
          onRemove: removeFeaturesByIds.bind(null, [feature.id]),
          onToggleVisibility: toggleFeatureVisibility.bind(null, feature.id),
        },
        dispatch
      ),
    });
  }
)(FeatureListEntryPresentation);

/**
 * Presentation component for the entire feature list.
 */
export const FeatureListPresentation = listOf(
  (feature) => <FeatureListEntry key={feature.id} feature={feature} />,
  {
    backgroundHint: 'No features',
    dataProvider: 'features',
    displayName: 'FeatureListPresentation',
  }
);

export default connect(
  // mapStateToProps
  (state) => ({
    features: getFeaturesInOrder(state),
  })
)(FeatureListPresentation);
