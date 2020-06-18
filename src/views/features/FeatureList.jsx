/**
 * @file Component that shows the list of features created by the user.
 */

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { showFeatureEditorDialog } from '~/actions/feature-editor';
import { listOf } from '~/components/helpers/lists';
import { getNameOfFeatureType, getIconOfFeatureType } from '~/model/features';
import { getFeaturesInOrder } from '~/selectors/ordered';

/**
 * Presentation component for a single entry in the feature list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const FeatureListEntry = (props) => {
  const { feature, onEditFeature } = props;
  const { id, color, label, type } = feature;
  return (
    <ListItem button data-id={id} onClick={onEditFeature}>
      <ListItemIcon style={{ color }}>
        {getIconOfFeatureType(type)}
      </ListItemIcon>
      {label ? (
        <ListItemText primary={label} />
      ) : (
        <ListItemText secondary={getNameOfFeatureType(type)} />
      )}
    </ListItem>
  );
};

FeatureListEntry.propTypes = {
  onEditFeature: PropTypes.func,
  feature: PropTypes.object.isRequired,
};

/**
 * Presentation component for the entire feature list.
 */
export const FeatureListPresentation = listOf(
  (feature, { onEditFeature }) => {
    return (
      <FeatureListEntry
        key={feature.id}
        feature={feature}
        onEditFeature={onEditFeature}
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
    disablePadding: true,
    features: getFeaturesInOrder(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onEditFeature(event) {
      const featureId = event.currentTarget.dataset.id;
      if (featureId) {
        dispatch(showFeatureEditorDialog(featureId));
      }
    },
  })
)(FeatureListPresentation);
