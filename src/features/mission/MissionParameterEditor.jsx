import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import Form from '@rjsf/material-ui';
import validator from '@rjsf/validator-ajv8';

import AsyncGuard from '~/components/AsyncGuard';
import { useMessageHub } from '~/hooks';

import { filterSchemaByUIContext } from './schema';

const FORM_UI_SCHEMA = {
  'ui:options': {
    submitButtonOptions: {
      norender: true,
    },
  },
};

const MissionParameterEditorPresentation = ({
  onChange,
  parameters,
  schema,
}) => {
  // Separate the full schema into the schema that contains only the parameters
  // that are to be queried from the user, and a mapping from UI context IDs to
  // the names of parameters that are to be provided by that UI context
  const { schema: filteredSchema, uiContexts } = useMemo(
    () => filterSchemaByUIContext(schema),
    [schema]
  );

  const handleChange = useCallback(
    ({ errors, formData }) => {
      // TODO(ntamas): extend formData with all the parameters that are to be
      // provided by the UI context
      if (errors.length === 0 && onChange) {
        onChange({
          fromUser: formData,
          fromContext: uiContexts,
        });
      }
    },
    [onChange, uiContexts]
  );

  return (
    <Form
      schema={filteredSchema}
      uiSchema={FORM_UI_SCHEMA}
      validator={validator}
      formData={parameters}
      onChange={handleChange}
    />
  );
};

MissionParameterEditorPresentation.propTypes = {
  onChange: PropTypes.func,
  parameters: PropTypes.object,
  schema: PropTypes.object,
};

const MissionParameterEditor = ({ missionType, onChange, parameters }) => {
  const messageHub = useMessageHub();
  const func = useCallback(async () => {
    if (missionType) {
      const schemas = await messageHub.query.getMissionTypeSchemas(
        missionType.id
      );
      return schemas.plan;
    } else {
      return undefined;
    }
  }, [messageHub, missionType]);

  return (
    <AsyncGuard
      func={func}
      errorMessage='Error while loading mission parameter schema from server'
      loadingMessage='Retrieving mission parameters...'
    >
      {(schema) => (
        <MissionParameterEditorPresentation
          schema={schema}
          parameters={parameters}
          onChange={onChange}
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
