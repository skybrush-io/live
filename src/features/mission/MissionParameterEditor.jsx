import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import Form from '@rjsf/material-ui';
import validator from '@rjsf/validator-ajv8';

import AsyncGuard from '~/components/AsyncGuard';
import { useMessageHub } from '~/hooks';

import ParametersTextField from './ParametersTextField';
import { filterSchemaByUIContext } from './schema';

const MissionParameterEditorPresentation = ({ parameters, onChange }) => {
  const handleParametersChange = ({ value, valid }) => {
    if (onChange) {
      if (valid) {
        const parsed = value.length > 0 ? JSON.parse(value) : {};
        onChange(typeof parsed === 'object' ? parsed : null);
      } else {
        onChange(null);
      }
    }
  };

  return (
    <ParametersTextField
      initialValue={parameters}
      onChange={handleParametersChange}
    />
  );
};

MissionParameterEditorPresentation.propTypes = {
  parameters: PropTypes.string,
  onChange: PropTypes.func,
};

const FORM_UI_SCHEMA = {
  'ui:options': {
    submitButtonOptions: {
      norender: true,
    },
  },
};

const MissionParameterEditor = ({ missionType, onChange, parameters }) => {
  const messageHub = useMessageHub();

  const func = useCallback(async () => {
    if (missionType) {
      const schemas = await messageHub.query.getMissionTypeSchemas(
        missionType.id
      );
      return filterSchemaByUIContext(schemas.plan).schema;
    } else {
      return undefined;
    }
  }, [messageHub, missionType]);

  const handleChange = useCallback(
    ({ errors, formData }) => {
      if (errors.length === 0 && onChange) {
        onChange(formData);
      }
    },
    [onChange]
  );

  return (
    <AsyncGuard
      func={func}
      errorMessage='Error while loading mission parameter schema from server'
      loadingMessage='Retrieving mission parameters...'
    >
      {(schema) => (
        <Form
          schema={schema}
          uiSchema={FORM_UI_SCHEMA}
          validator={validator}
          formData={parameters}
          onChange={handleChange}
        />
      )}
    </AsyncGuard>
  );
};

MissionParameterEditor.propTypes = {
  missionType: PropTypes.shape({
    id: PropTypes.string,
  }),
  onChange: PropTypes.func,
  parameters: PropTypes.object,
};

export default MissionParameterEditor;
