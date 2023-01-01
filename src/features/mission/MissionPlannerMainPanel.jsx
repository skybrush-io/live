import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import List from '@material-ui/core/List';
import Clear from '@material-ui/icons/Clear';

import DialogHeaderListItem from '~/components/DialogHeaderListItem';
import MultiPagePanel, { Page } from '~/components/MultiPagePanel';

import MissionTypeSelector from './MissionTypeSelector';
import MissionParameterEditor from './MissionParameterEditor';
import { IconButton } from '@material-ui/core';

const MissionPlannerMainPanel = ({
  missionType,
  onMissionTypeChange,
  onMissionTypeCleared,
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
      <List disablePadding>
        <DialogHeaderListItem>
          <ListItemText
            primary={missionType?.name || 'No mission type selected'}
            secondary={missionType?.description}
          />
          {missionType && (
            <ListItemSecondaryAction>
              <IconButton
                edge='end'
                aria-label='remove'
                onClick={() => onMissionTypeCleared()}
              >
                <Clear />
              </IconButton>
            </ListItemSecondaryAction>
          )}
        </DialogHeaderListItem>
      </List>
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
  onMissionTypeCleared: PropTypes.func,
  parameters: PropTypes.object,
  onParametersChange: PropTypes.func,
  selectedPage: PropTypes.oneOf(['parameters', 'type']).isRequired,
};

export default MissionPlannerMainPanel;
