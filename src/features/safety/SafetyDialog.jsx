/**
 * @file Dialog for managing safety related preferences.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import DialogContent from '@material-ui/core/DialogContent';
import Tab from '@material-ui/core/Tab';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';
import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { tt } from '~/i18n';
import { hasFeature } from '~/utils/configuration';

import { SafetyDialogTab } from './constants';
import GeofenceSettingsTab from './GeofenceSettingsTab';
import SafetySettingsTab from './SafetySettingsTab';
import { getSelectedTabInSafetyDialog, isSafetyDialogOpen } from './selectors';
import { closeSafetyDialog, setSafetyDialogTab } from './slice';

const tabs = [
  hasFeature('geofence') && {
    id: SafetyDialogTab.GEOFENCE,
    name: tt('safetyDialog.geofence'),
    component: GeofenceSettingsTab,
  },
  hasFeature('safetySettings') && {
    id: SafetyDialogTab.SETTINGS,
    name: tt('safetyDialog.settings'),
    component: SafetySettingsTab,
  },
].filter(Boolean);

/**
 * Dialog for configuring safety related settings, including the geofence.
 */
const SafetyDialog = ({ onClose, onTabSelected, open, selectedTab, t }) => {
  const SelectedTabComponent =
    tabs.find((tab) => tab.id === selectedTab)?.component ??
    (() => (
      <DialogContent>
        <BackgroundHint text='The selected tab is currently not available.' />
      </DialogContent>
    ));

  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='xs'
      title={t('safetyDialog.title')}
      toolbarComponent={(dragHandleId) => (
        <DialogTabs
          // TODO: Alignment doesn't currently work with `dragHandle`
          //       (DraggableDialog should use a class instead of an id.)
          // alignment='center'
          dragHandle={dragHandleId}
          value={selectedTab}
          onChange={onTabSelected}
        >
          {tabs.map(({ id, name }) => (
            <Tab key={id} label={name(t)} value={id} />
          ))}
        </DialogTabs>
      )}
      onClose={onClose}
    >
      <SelectedTabComponent onClose={onClose} />
    </DraggableDialog>
  );
};

SafetyDialog.propTypes = {
  onClose: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool.isRequired,
  selectedTab: PropTypes.oneOf(tabs.map((t) => t.id)),
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: isSafetyDialogOpen(state),
    selectedTab: getSelectedTabInSafetyDialog(state),
  }),
  // mapDispatchToProps
  {
    onClose: closeSafetyDialog,
    onTabSelected: (_event, value) => setSafetyDialogTab(value),
  }
)(withTranslation()(SafetyDialog));
