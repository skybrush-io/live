/**
 * @file Component that shows the list of features created by the user.
 */

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Edit from '@material-ui/icons/Edit';

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
import { getNameOfFeatureType, getIconOfFeatureType } from '~/model/features';
import { featureIdToGlobalId } from '~/model/identifiers';
import { getFeaturesInOrder } from '~/selectors/ordered';
import { getSelectedFeatureIds } from '~/selectors/selection';

/**
 * Presentation component for a single entry in the feature list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const FeatureListEntry = (props) => {
  const { feature, onEditFeature, onSelectFeature, selected } = props;
  const { id, color, label, type } = feature;

  const actionButton = (
    <Tooltip content='Feature properties'>
      <IconButton edge='end' data-id={id} onClick={onEditFeature}>
        <Edit />
      </IconButton>
    </Tooltip>
  );

  return (
    <ListItem button selected={selected} data-id={id} onClick={onSelectFeature}>
      <ListItemIcon style={{ color }}>
        {getIconOfFeatureType(type)}
      </ListItemIcon>
      {label ? (
        <ListItemText primary={label} />
      ) : (
        <ListItemText secondary={getNameOfFeatureType(type)} />
      )}
      <ListItemSecondaryAction>{actionButton}</ListItemSecondaryAction>
    </ListItem>
  );
};

FeatureListEntry.propTypes = {
  onEditFeature: PropTypes.func,
  onSelectFeature: PropTypes.func,
  feature: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};

/**
 * Presentation component for the entire feature list.
 */
export const FeatureListPresentation = listOf(
  (feature, { onEditFeature, onSelectFeature, selectedFeatureIds }) => {
    return (
      <FeatureListEntry
        key={feature.id}
        feature={feature}
        selected={selectedFeatureIds.includes(feature.id)}
        onEditFeature={onEditFeature}
        onSelectFeature={onSelectFeature}
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
  })
)(FeatureListPresentation);
