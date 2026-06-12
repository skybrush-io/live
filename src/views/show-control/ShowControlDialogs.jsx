import React from 'react';

import { hasFeature } from '~/utils/configuration';

import EnvironmentEditorDialog from './EnvironmentEditorDialog';
import LoadShowFromCloudDialog from './LoadShowFromCloudDialog';
import ManualPreflightChecksDialog from './ManualPreflightChecksDialog';
import OnboardPreflightChecksDialog from './OnboardPreflightChecksDialog';
import StartTimeDialog from './StartTimeDialog';
import TakeoffAreaSetupDialog from './TakeoffAreaSetupDialog';

/**
 * Dialogs opened from show-control UI (sidebar or bottom bar).
 */
const ShowControlDialogs = () => (
  <>
    {hasFeature('loadShowFromCloud') && <LoadShowFromCloudDialog />}
    <EnvironmentEditorDialog />
    <StartTimeDialog />
    <TakeoffAreaSetupDialog />
    <OnboardPreflightChecksDialog />
    <ManualPreflightChecksDialog />
  </>
);

export default ShowControlDialogs;
