import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';
import { useAsync } from 'react-use';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ArrowBack from '@material-ui/icons/ArrowBack';

import SmallProgressIndicator from '@skybrush/mui-components/lib/SmallProgressIndicator';

import { DistanceField, DurationField } from '~/components/forms/fields';
import messageHub from '~/message-hub';

import { startNewSurveyOnServer } from './actions';
import { toggleSurveySettingsPanel } from './slice';

const SurveySettingsEditor = ({ onClose, onSubmit, ...rest }) => {
  const settings = useAsync(async () => {
    const settingsFromServer = await messageHub.query.getRTKSurveySettings();
    return settingsFromServer
      ? {
          accuracy: settingsFromServer.accuracy,
          duration: settingsFromServer.duration,
        }
      : {
          accuracy: 100,
          duration: 60,
        };
  }, []);

  return (
    <Box display='flex' flexDirection='row' alignItems='center' {...rest}>
      <IconButton onClick={onClose}>
        <ArrowBack />
      </IconButton>
      {settings.loading ? (
        <SmallProgressIndicator text='Loading...' />
      ) : settings.error ? (
        <div>Failed to load survey settings from server.</div>
      ) : (
        <Form initialValues={settings.value} onSubmit={onSubmit}>
          {({ handleSubmit }) => (
            <>
              <Box p={0.5} />
              <DistanceField
                name='accuracy'
                label='Desired accuracy'
                min={0.01}
                max={100}
                step={0.01}
                size='small'
                unit='m'
                style={{ flex: 1 }}
              />
              <Box p={1} />
              <DurationField
                name='duration'
                label='Minimum duration'
                min={1}
                max={3600}
                step={1}
                size='small'
                style={{ flex: 1 }}
              />
              <Box p={0.5} />
              <Button onClick={handleSubmit}>Start survey</Button>
            </>
          )}
        </Form>
      )}
    </Box>
  );
};

SurveySettingsEditor.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClose: toggleSurveySettingsPanel,
    onSubmit: ({ accuracy, duration }) =>
      startNewSurveyOnServer({
        accuracy: Number(accuracy),
        duration: Number(duration),
      }),
  }
)(SurveySettingsEditor);
