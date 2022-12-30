import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

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

const MissionParameterEditor = ({ missionType, style, ...rest }) => {
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

  return (
    <AsyncGuard
      func={func}
      errorMessage='Error while loading mission parameter schema from server'
      loadingMessage='Retrieving mission parameters...'
      style={style}
    >
      {(_schema) => (
        <MissionParameterEditorPresentation style={style} {...rest} />
      )}
    </AsyncGuard>
  );
};

MissionParameterEditor.propTypes = {
  missionType: PropTypes.shape({
    id: PropTypes.string,
  }),
  style: PropTypes.object,
};

export default MissionParameterEditor;
