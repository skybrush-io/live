/**
 * @file Component that shows the list of features created by the user.
 */

import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import FilterCenterFocus from '@mui/icons-material/FilterCenterFocus';
import MoreVert from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type React from 'react';
import { createElement, useCallback } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import type { UnknownAction } from '@reduxjs/toolkit';

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
import type { FeatureWithProperties } from '~/features/map-features/types';
import useDropdown from '~/hooks/useDropdown';
import { FeatureType, getIconOfFeatureType } from '~/model/features';
import type { AppDispatch, RootState } from '~/store/reducers';
import { fitCoordinatesIntoMapView } from '~/signals';

const ICON_SIZE = 24;
const GAP_SIZE = 12;

const ACTION_BUTTON_COLLAPSE_THRESHOLD = 350;
const NUM_BUTTONS = 4;

const useStyles = makeStyles({
  button: {
    [`@container (max-width: ${ACTION_BUTTON_COLLAPSE_THRESHOLD}px)`]: {
      display: 'none',
    },
  },
  menu: {
    [`@container (min-width: ${ACTION_BUTTON_COLLAPSE_THRESHOLD + 1}px)`]: {
      display: 'none',
    },
  },
  listItem: {
    containerType: 'inline-size',
    [`@container (min-width: ${ACTION_BUTTON_COLLAPSE_THRESHOLD + 1}px)`]: {
      paddingRight: (ICON_SIZE + GAP_SIZE) * NUM_BUTTONS,
    },
  },
});

type FeatureListEntryProps = {
  feature: FeatureWithProperties;
  onEdit?: () => void;
  onRemove?: () => void;
  onSelect?: (event: React.UIEvent) => void;
  onToggleVisibility?: () => void;
  selected?: boolean;
  shouldFill?: boolean;
  suggestedColor?: string;
  suggestedLabel?: string;
};

/**
 * Presentation component for a single entry in the feature list.
 */
const FeatureListEntryPresentation = ({
  feature,
  onEdit,
  onRemove,
  onSelect,
  onToggleVisibility,
  selected,
  shouldFill,
  suggestedColor,
  suggestedLabel,
}: FeatureListEntryProps) => {
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

  const classes = useStyles();

  const actionButtons = (
    <>
      {actions.map(({ action, icon, key, label }) => (
        <Tooltip key={key} content={label}>
          <IconButton
            className={classes.button}
            edge='end'
            size='large'
            onClick={action}
          >
            {icon}
          </IconButton>
        </Tooltip>
      ))}
    </>
  );

  const [menuAnchorElement, openMenu, closeMenu, closeMenuWith] = useDropdown();
  const actionMenu = (
    <>
      <IconButton
        className={classes.menu}
        edge='end'
        size='large'
        onClick={openMenu}
      >
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
      disablePadding
      secondaryAction={
        <>
          {actionButtons}
          {actionMenu}
        </>
      }
      className={classes.listItem}
    >
      <ListItemButton selected={selected} onClick={onSelect}>
        <ListItemIcon
          style={{ color: suggestedColor, minWidth: 0, marginRight: '16px' }}
        >
          {createElement(getIconOfFeatureType(type, Boolean(shouldFill)))}
        </ListItemIcon>
        {label ? (
          <ListItemText
            style={{ overflowWrap: 'break-word' }}
            primary={label}
          />
        ) : (
          <ListItemText secondary={suggestedLabel} />
        )}
      </ListItemButton>
    </ListItem>
  );
};

const FeatureListEntry = connect(
  // mapStateToProps
  (state: RootState, { feature }: FeatureListEntryProps) => ({
    selected: getSelectedFeatureIds(state).includes(feature.id),
    shouldFill: shouldFillFeature(state, feature.id),
    suggestedColor: suggestedColorForFeature(state, feature.id),
    suggestedLabel: suggestedLabelForFeature(state, feature.id),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch, { feature }: FeatureListEntryProps) => {
    const selectionHandlerThunk = createSelectionHandlerThunk({
      activateItem: showFeatureEditorDialog,
      getSelection: getSelectedFeatureIds,
      // NOTE: Cast needed as the action factory comes from a JavaScript
      // module so its return type cannot be inferred precisely enough.
      setSelection: setSelectedFeatureIds as (value: string[]) => UnknownAction,
      getListItems: getFeatureIds,
    });

    return {
      onEdit: () => dispatch(showFeatureEditorDialog(feature.id)),
      onSelect: (event: React.UIEvent) =>
        dispatch(selectionHandlerThunk(feature.id, event)),
      onRemove: () => dispatch(removeFeaturesByIds([feature.id])),
      onToggleVisibility: () => dispatch(toggleFeatureVisibility(feature.id)),
    };
  }
)(FeatureListEntryPresentation);

type FeatureListPresentationProps = {
  dense?: boolean;
} & React.RefAttributes<HTMLUListElement>;

/**
 * Presentation component for the entire feature list.
 */
export const FeatureListPresentation = listOf<
  FeatureWithProperties,
  FeatureListPresentationProps
>((feature) => <FeatureListEntry key={feature.id} feature={feature} />, {
  backgroundHint: 'No features',
  dataProvider: 'features',
  displayName: 'FeatureListPresentation',
});

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    features: getFeaturesInOrder(state),
  })
)(FeatureListPresentation);
