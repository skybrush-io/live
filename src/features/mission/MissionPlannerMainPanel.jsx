import Clear from '@mui/icons-material/Clear';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';

import DialogHeaderListItem from '~/components/DialogHeaderListItem';
import MultiPagePanel, { Page } from '~/components/MultiPagePanel';
import { useMessageHub } from '~/hooks';

import MissionParameterEditor from './MissionParameterEditor';
import MissionTypeSelector from './MissionTypeSelector';

const MissionPlannerMainPanel = ({
  onMissionTypeChange,
  onMissionTypeCleared,
  onParametersChange,
  parameters,
  selectedType,
  selectedTypeInfo,
}) => {
  const messageHub = useMessageHub();
  const missionPlannerInfoCache = useMemo(
    () => ({
      getTypes: memoizee(
        () => messageHub.query.getMissionTypes({ features: ['plan'] }),
        { promise: true }
      ),
      getSchema: memoizee(
        (type) => messageHub.query.getMissionTypeSchemas(type),
        { promise: true }
      ),
    }),
    [messageHub]
  );

  // Handle mission type changes in the state outside of `MissionTypeSelector`,
  // e.g. when importing a mission.
  useEffect(() => {
    if (
      messageHub.canSend() &&
      selectedType &&
      (!selectedTypeInfo || selectedTypeInfo.id !== selectedType)
    ) {
      missionPlannerInfoCache
        .getTypes()
        .then((types) => {
          const type = types.find((t) => t.id === selectedType);
          if (type) {
            onMissionTypeChange(type);
          } else {
            onMissionTypeCleared();
          }
        })
        .catch((error) => {
          console.warn('Error while fetching mission types', error);
        });
    }
  }, [
    messageHub,
    missionPlannerInfoCache,
    onMissionTypeChange,
    selectedType,
    selectedTypeInfo,
  ]);

  return (
    <MultiPagePanel
      height={400}
      selectedPage={
        selectedType && selectedTypeInfo?.id === selectedType
          ? 'parameters'
          : 'type'
      }
    >
      <Page scrollable id='type'>
        <MissionTypeSelector
          getTypes={missionPlannerInfoCache.getTypes}
          value={selectedType}
          onChange={(_event, value) => onMissionTypeChange(value)}
        />
      </Page>

      <Page id='parameters' display='flex' flexDirection='column'>
        <List disablePadding>
          <DialogHeaderListItem>
            <ListItemText
              primary={selectedTypeInfo?.name || 'No mission type selected'}
              secondary={selectedTypeInfo?.description}
            />
            {selectedTypeInfo && (
              <ListItemSecondaryAction>
                <IconButton
                  edge='end'
                  aria-label='remove'
                  size='large'
                  onClick={onMissionTypeCleared}
                >
                  <Clear />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </DialogHeaderListItem>
        </List>
        <Box sx={{ px: 2, position: 'relative', flex: 1, overflow: 'auto' }}>
          <MissionParameterEditor
            getSchema={missionPlannerInfoCache.getSchema}
            parameters={parameters}
            selectedType={selectedType}
            onChange={onParametersChange}
          />
        </Box>
      </Page>
    </MultiPagePanel>
  );
};

MissionPlannerMainPanel.propTypes = {
  onMissionTypeChange: PropTypes.func,
  onMissionTypeCleared: PropTypes.func,
  onParametersChange: PropTypes.func,
  parameters: PropTypes.object,
  selectedType: PropTypes.string,
  selectedTypeInfo: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
  }),
};

export default MissionPlannerMainPanel;
