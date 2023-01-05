/**
 * @file Component that shows the list of features created by the user.
 */

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';

import Edit from '@material-ui/icons/Edit';
import FilterCenterFocus from '@material-ui/icons/FilterCenterFocus';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { listOf } from '~/components/helpers/lists';
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
import { updateFeatureVisibility } from '~/features/map-features/slice';
import { getNameOfFeatureType, getIconOfFeatureType } from '~/model/features';
import { featureIdToGlobalId } from '~/model/identifiers';
import { fitCoordinatesIntoMapView } from '~/signals';

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
    onSelectFeature,
    onToggleFeatureVisibility,
    selected,
  } = props;
  const { id, color, label, type, visible } = feature;

  const actionButtons = (
    <>
      <Tooltip content='Focus feature'>
        <IconButton edge='end' data-id={id} onClick={onFocusFeature}>
          <FilterCenterFocus />
        </IconButton>
      </Tooltip>
      <Tooltip content='Toggle visibility'>
        <IconButton edge='end' data-id={id} onClick={onToggleFeatureVisibility}>
          {visible ? <Visibility /> : <VisibilityOff color='disabled' />}
        </IconButton>
      </Tooltip>
      <Tooltip content='Feature properties'>
        <IconButton edge='end' data-id={id} onClick={onEditFeature}>
          <Edit />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <ListItem
      button
      style={{ paddingRight: '120px' }}
      selected={selected}
      data-id={id}
      onClick={onSelectFeature}
    >
      <ListItemIcon style={{ color }}>
        {getIconOfFeatureType(type)}
      </ListItemIcon>
      {label ? (
        <ListItemText primary={label} />
      ) : (
        <ListItemText secondary={getNameOfFeatureType(type)} />
      )}
      <ListItemSecondaryAction>{actionButtons}</ListItemSecondaryAction>
    </ListItem>
  );
};

FeatureListEntry.propTypes = {
  onEditFeature: PropTypes.func,
  onFocusFeature: PropTypes.func,
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
        onSelectFeature={onSelectFeature}
        onToggleFeatureVisibility={onToggleFeatureVisibility}
      />
    );
  },
  {
    backgroundHint: 'No features',
    dataProvider: 'features',
    displayName: 'FeatureListPresentation',
  }
);

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
