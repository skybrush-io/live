import Box from '@mui/material/Box';
import List from '@mui/material/List';

import { hasFeature } from '~/utils/configuration';

import AuthorizationButton from './AuthorizationButton';
import EnvironmentEditorDialog from './EnvironmentEditorDialog';
import LoadShowFromCloudDialog from './LoadShowFromCloudDialog';
import ManualPreflightChecksDialog from './ManualPreflightChecksDialog';
import OnboardPreflightChecksDialog from './OnboardPreflightChecksDialog';
import ShowControlPanelUpperSegment from './ShowControlPanelUpperSegment';
import StartTimeDialog from './StartTimeDialog';
import TakeoffAreaSetupDialog from './TakeoffAreaSetupDialog';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanel = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <ShowControlPanelUpperSegment />

    <Box className='bottom-bar'>
      <List dense disablePadding>
        <AuthorizationButton />
      </List>
    </Box>

    {hasFeature('loadShowFromCloud') && <LoadShowFromCloudDialog />}
    <EnvironmentEditorDialog />
    <StartTimeDialog />
    <TakeoffAreaSetupDialog />
    <OnboardPreflightChecksDialog />
    <ManualPreflightChecksDialog />
  </Box>
);

export default ShowControlPanel;
