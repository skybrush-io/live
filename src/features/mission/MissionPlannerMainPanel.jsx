import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Box from '@material-ui/core/Box';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';

import DialogHeaderListItem from '~/components/DialogHeaderListItem';
import MultiPagePanel, { Page } from '~/components/MultiPagePanel';

import MissionTypeSelector from './MissionTypeSelector';
import MissionParameterEditor from './MissionParameterEditor';

const ParametersTextField = ({ initialValue, onChange }) => {
  const [currentValue, setCurrentValue] = useState(initialValue || '');
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setCurrentValue(event.target.value);
  };

  const validate = () => {
    let valid = false;

    try {
      if (currentValue.length > 0) {
        JSON.parse(currentValue);
      }

      valid = true;
    } catch (error) {
      setError(error.message || String(error));
    }

    if (valid) {
      setError('');
    }

    if (onChange) {
      onChange({ value: currentValue, valid });
    }
  };

  return (
    <TextField
      autoFocus
      fullWidth
      multiline
      error={Boolean(error)}
      label='Parameter names and values'
      variant='filled'
      minRows={10}
      helperText={error || 'Specify parameters in JSON format.'}
      value={currentValue}
      onBlur={validate}
      onChange={handleChange}
    />
  );
};

ParametersTextField.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func,
};

const MissionPlannerMainPanel = ({
  missionType,
  onMissionTypeChange,
  onParametersChange,
  parameters,
  selectedPage,
}) => {
  const handleParametersChange = ({ value, valid }) => {
    if (onParametersChange) {
      if (valid) {
        const parsed = value.length > 0 ? JSON.parse(value) : {};
        onParametersChange(typeof parsed === 'object' ? parsed : null);
      } else {
        onParametersChange(null);
      }
    }
  };

  return (
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
        <Box pt={2} px={2} position='relative' flex={1} overflow='auto'>
          <ParametersTextField
            initialValue={parameters}
            onChange={handleParametersChange}
          />
        </Box>
      </Page>
    </MultiPagePanel>
  );
};

MissionPlannerMainPanel.propTypes = {
  missionType: PropTypes.string,
  onMissionTypeChange: PropTypes.func,
  parameters: PropTypes.string,
  onParametersChange: PropTypes.func,
  selectedPage: PropTypes.oneOf(['parameters', 'type']).isRequired,
};

export default MissionPlannerMainPanel;
