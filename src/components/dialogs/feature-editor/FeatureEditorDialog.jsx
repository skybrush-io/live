import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Tab from '@mui/material/Tab';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';

import {
  closeFeatureEditorDialog,
  setFeatureEditorDialogTab,
} from '~/features/map-features/actions';
import {
  getEditedFeatureId,
  getEditorDialogVisibility,
  getFeatureById,
  getSelectedTab,
} from '~/features/map-features/selectors';
import { removeFeaturesByIds } from '~/features/map-features/slice';

import {
  FeatureEditorDialogTab,
  featureEditorDialogTabs,
  labelForFeatureEditorDialogTab,
} from '~/features/map-features/types';

import FeatureAttributesForm from './FeatureAttributesForm';
import FeaturePointsForm from './FeaturePointsForm';
import GeneralPropertiesForm from './GeneralPropertiesForm';

const FeatureEditorDialogPresentation = (props) => {
  const {
    feature,
    featureId,
    onClose,
    onRemoveFeature,
    onTabSelected,
    open,
    selectedTab,
  } = props;

  const SelectedTab = {
    [FeatureEditorDialogTab.GENERAL]: GeneralPropertiesForm,
    [FeatureEditorDialogTab.ATTRIBUTES]: FeatureAttributesForm,
    [FeatureEditorDialogTab.POINTS]: FeaturePointsForm,
  }[selectedTab];

  const content = feature ? (
    SelectedTab && <SelectedTab feature={feature} featureId={featureId} />
  ) : (
    <p>Feature does not exist</p>
  );

  const actions = [
    <Button
      key='remove'
      color='secondary'
      disabled={!feature}
      onClick={onRemoveFeature}
    >
      Remove
    </Button>,
    <Button key='close' onClick={onClose}>
      Close
    </Button>,
  ];

  return (
    <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
      <DialogTabs value={selectedTab} onChange={onTabSelected}>
        {featureEditorDialogTabs.map((tab) => (
          <Tab
            key={tab}
            value={tab}
            label={labelForFeatureEditorDialogTab[tab]}
          />
        ))}
      </DialogTabs>
      <DialogContent
        style={{
          // Prevent the dialog height from jumping when switching between tabs
          height: 325,
        }}
      >
        {content}
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};

FeatureEditorDialogPresentation.propTypes = {
  feature: PropTypes.object,
  featureId: PropTypes.string,
  onClose: PropTypes.func,
  onRemoveFeature: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool.isRequired,
  selectedTab: PropTypes.oneOf(Object.values(FeatureEditorDialogTab)),
};

FeatureEditorDialogPresentation.defaultProps = {
  selectedTab: FeatureEditorDialogTab.GENERAL,
};

/**
 * Container of the dialog that shows the form where a given feature can
 * be edited.
 */
const FeatureEditorDialog = connect(
  // mapStateToProps
  (state) => {
    const featureId = getEditedFeatureId(state);
    return {
      featureId,
      selectedTab: getSelectedTab(state),
      feature: getFeatureById(state, featureId),
      open: getEditorDialogVisibility(state),
    };
  },
  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeFeatureEditorDialog());
    },
    onRemoveFeature(featureId) {
      dispatch(removeFeaturesByIds([featureId]));
      dispatch(closeFeatureEditorDialog());
    },
    onTabSelected(_event, value) {
      dispatch(setFeatureEditorDialogTab(value));
    },
  }),
  // mergeProps
  (stateProps, dispatchProps) => ({
    ...stateProps,
    ...dispatchProps,
    onRemoveFeature: () => dispatchProps.onRemoveFeature(stateProps.featureId),
  })
)(FeatureEditorDialogPresentation);

export default FeatureEditorDialog;
