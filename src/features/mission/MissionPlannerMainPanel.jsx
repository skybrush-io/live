import PropTypes from 'prop-types';
import React, { useState } from 'react';

import TextField from '@material-ui/core/TextField';

import MultiPagePanel, { Page } from '~/components/MultiPagePanel';

import MissionTypeSelector from './MissionTypeSelector';

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
    <MultiPagePanel
      height={300}
      selectedPage={missionType ? 'parameters' : 'type'}
    >
      <Page id='type'>
        <MissionTypeSelector
          value={missionType}
          onChange={(event, value) => onMissionTypeChange(value)}
        />
      </Page>

      <Page id='parameters' pt={3} px={3}>
        <ParametersTextField
          initialValue={parameters}
          onChange={handleParametersChange}
        />
      </Page>
    </MultiPagePanel>
  );
};

MissionPlannerMainPanel.propTypes = {
  missionType: PropTypes.string,
  onMissionTypeChange: PropTypes.func,
  parameters: PropTypes.string,
  onParametersChange: PropTypes.func,
};

export default MissionPlannerMainPanel;
