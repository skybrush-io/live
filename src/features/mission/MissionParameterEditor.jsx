import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import AsyncGuard from '~/components/AsyncGuard';
import { useMessageHub } from '~/hooks';

import { filterSchemaByUIContext } from './schema';

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
      {(schema) => (
        <div style={style} {...rest}>
          {JSON.stringify(schema)}
        </div>
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
