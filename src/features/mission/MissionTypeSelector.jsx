import PropTypes from 'prop-types';
import React from 'react';
import { useAsyncRetry } from 'react-use';

import Button from '@material-ui/core/Button';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Error from '@material-ui/icons/Error';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import LargeProgressIndicator from '@skybrush/mui-components/lib/LargeProgressIndicator';

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
    backgroundHint: 'No mission types',
  }
);

MissionTypeSelectorPresentation.displayName = 'ClockDisplayListPresentation';

const AsyncGuard = ({
  children,
  func,
  errorMessage,
  loadingMessage,
  style,
}) => {
  // style prop is forwarded to make this component play nicely when it is used
  // as a top-level component in a transition

  const state = useAsyncRetry(() => (func ? func() : undefined), [func]);

  if (state.error && !state.loading) {
    return (
      <BackgroundHint
        icon={<Error />}
        text={errorMessage || 'An unexpected error happened'}
        button={<Button onClick={state.retry}>Try again</Button>}
        style={style}
      />
    );
  }

  if (state.loading) {
    return (
      <LargeProgressIndicator
        fullHeight
        label={loadingMessage || 'Please wait, loading...'}
        style={style}
      />
    );
  }

  return children ? children(state.value) : null;
};

AsyncGuard.propTypes = {
  children: PropTypes.func,
  func: PropTypes.func,
  errorMessage: PropTypes.string,
  loadingMessage: PropTypes.string,
  style: PropTypes.object,
};

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
