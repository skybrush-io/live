import ArrowBack from '@mui/icons-material/ArrowBack';
import Box, { type BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';
import { useAsync } from 'react-use';

import { SmallProgressIndicator } from '@skybrush/mui-components';

import { DistanceField, DurationField } from '~/components/forms/fields';
import messageHub from '~/message-hub';

import { startNewSurveyOnServer } from './actions';
import { toggleSurveySettingsPanel } from './slice';

type Props = Omit<BoxProps, 'onClose' | 'onSubmit'> & {
  onClose: () => void;
  onSubmit: (values: { accuracy: number; duration: number }) => void;
};

const SurveySettingsEditor = ({ onClose, onSubmit, ...rest }: Props) => {
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
    <Box
      {...rest}
      sx={[
        {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    >
      <IconButton size='large' onClick={onClose}>
        <ArrowBack />
      </IconButton>
      {settings.loading ? (
        <SmallProgressIndicator label='Loading...' />
      ) : settings.error ? (
        <div>Failed to load survey settings from server.</div>
      ) : (
        <Form initialValues={settings.value} onSubmit={onSubmit}>
          {({ handleSubmit }) => (
            <>
              <Box sx={{ p: 0.5 }} />
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
              <Box sx={{ p: 1 }} />
              <DurationField
                name='duration'
                label='Minimum duration'
                min={1}
                max={3600}
                step={1}
                size='small'
                style={{ flex: 1 }}
              />
              <Box sx={{ p: 0.5 }} />
              <Button onClick={void handleSubmit}>Start survey</Button>
            </>
          )}
        </Form>
      )}
    </Box>
  );
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClose: toggleSurveySettingsPanel,
    onSubmit: ({
      accuracy,
      duration,
    }: {
      accuracy: number;
      duration: number;
    }) =>
      startNewSurveyOnServer({
        accuracy: Number(accuracy),
        duration: Number(duration),
      }),
  }
)(SurveySettingsEditor);
