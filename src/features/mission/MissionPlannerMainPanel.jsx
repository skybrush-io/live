import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import ListItemText from '@material-ui/core/ListItemText';

import DialogHeaderListItem from '~/components/DialogHeaderListItem';
import MultiPagePanel, { Page } from '~/components/MultiPagePanel';

import MissionTypeSelector from './MissionTypeSelector';
import MissionParameterEditor from './MissionParameterEditor';

const MissionPlannerMainPanel = ({
  missionType,
  onMissionTypeChange,
  onParametersChange,
  parameters,
  selectedPage,
}) => (
  <MultiPagePanel height={350} selectedPage={selectedPage}>
    <Page scrollable id='type'>
      <MissionTypeSelector
        value={missionType}
        onChange={(event, value) => onMissionTypeChange(value)}
      />
    </Page>

    <Page id='parameters' display='flex' flexDirection='column'>
      <DialogHeaderListItem>
        <ListItemText
          primary={missionType?.name || 'No mission type selected'}
          secondary={missionType?.description}
        />
      </DialogHeaderListItem>
      <Box px={2} position='relative' flex={1} overflow='auto'>
        <MissionParameterEditor
          missionType={missionType}
          parameters={parameters}
          onChange={onParametersChange}
        />
      </Box>
    </Page>
  </MultiPagePanel>
);

MissionPlannerMainPanel.propTypes = {
  missionType: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
  }),
  onMissionTypeChange: PropTypes.func,
  parameters: PropTypes.object,
  onParametersChange: PropTypes.func,
  selectedPage: PropTypes.oneOf(['parameters', 'type']).isRequired,
};

export default MissionPlannerMainPanel;
