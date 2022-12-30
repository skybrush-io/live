import PropTypes from 'prop-types';
import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import AsyncGuard from '~/components/AsyncGuard';
import { selectableListOf } from '~/components/helpers/lists';
import useMessageHub from '~/hooks/useMessageHub';

const MissionTypeListEntry = ({ name, description, onItemSelected }) => (
  <ListItem button onClick={onItemSelected}>
    <ListItemText primary={name} secondary={description} />
  </ListItem>
);

MissionTypeListEntry.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  onItemSelected: PropTypes.func,
};

const MissionTypeSelectorPresentation = selectableListOf(
  (missionType, props) => (
    <MissionTypeListEntry key={missionType.id} {...missionType} {...props} />
  ),
  {
    dataProvider: 'items',
    displayName: 'MissionTypeSelectorPresentation',
    backgroundHint: 'No mission types',
  }
);

const MissionTypeSelector = ({ style, ...rest }) => {
  const messageHub = useMessageHub();
  const func = () => messageHub.query.getMissionTypes({ features: ['plan'] });
  return (
    <AsyncGuard
      func={func}
      errorMessage='Error while loading mission types from server'
      loadingMessage='Retrieving mission types...'
      style={style}
    >
      {(items) => (
        <MissionTypeSelectorPresentation
          items={items}
          style={style}
          {...rest}
        />
      )}
    </AsyncGuard>
  );
};

MissionTypeSelector.propTypes = {
  onChange: PropTypes.func,
  style: PropTypes.object,
  value: PropTypes.any,
};

export default MissionTypeSelector;
