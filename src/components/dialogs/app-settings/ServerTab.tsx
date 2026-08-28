import Folder from '@mui/icons-material/FolderOpen';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { Tooltip } from '@skybrush/mui-components';
import remove from 'lodash-es/remove';
import trim from 'lodash-es/trim';
import type { ChangeEvent, ChangeEventHandler } from 'react';
import { connect } from 'react-redux';

import { getLocalServerSearchPath } from '~/features/local-server/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import type { SettingsState } from '~/features/settings/types';
import type { AppThunk, RootState } from '~/store/reducers';

import PathScanner from './PathScanner';

type Props = {
  cliArguments: string;
  enabled: boolean;
  onDisable: () => void;
  onEnable: () => void;
  onSearchPathChanged: ChangeEventHandler;
  onSelectSearchPath?: () => void;
  onTextFieldChanged: ChangeEventHandler;
  searchPath: string;
};

const ServerTabPresentation = ({
  cliArguments,
  enabled,
  onDisable,
  onEnable,
  onSearchPathChanged,
  onSelectSearchPath,
  onTextFieldChanged,
  searchPath,
}: Props) => (
  <div style={{ position: 'relative', top: -8 }}>
    <List dense disablePadding style={{ margin: '0 -24px' }}>
      <PathScanner />
      <ListItemButton disableRipple onClick={enabled ? onDisable : onEnable}>
        <ListItemIcon style={{ margin: '0 17px 0 2px' }}>
          <Switch checked={enabled} />
        </ListItemIcon>
        <ListItemText
          primary='Launch local server automatically'
          secondary='Only if the application is connecting to localhost'
        />
      </ListItemButton>
    </List>
    <FormGroup>
      <Box sx={{ mt: 1 }}>
        <TextField
          fullWidth
          id='cliArguments'
          label='Command line arguments'
          value={cliArguments}
          variant='filled'
          helperText={
            'These arguments will be supplied to the local server ' +
            'upon startup.'
          }
          onChange={onTextFieldChanged}
        />
      </Box>
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
        }}
      >
        <TextField
          fullWidth
          multiline
          id='searchPath'
          label='Search path'
          value={searchPath}
          variant='filled'
          helperText={
            'Enter directories to search for the Skybrush server ' +
            'executable, one per line.'
          }
          onChange={onSearchPathChanged}
        />
        {onSelectSearchPath && (
          <Tooltip content='Select folder containing server executable'>
            <IconButton size='large' onClick={onSelectSearchPath}>
              <Folder />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </FormGroup>
  </div>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...state.settings.localServer,
    searchPath: getLocalServerSearchPath(state).join('\n'),
  }),
  // mapDispatchToProps
  {
    onCheckboxToggled: (event: ChangeEvent<HTMLInputElement>) =>
      updateAppSettings('localServer', {
        [event.target.name]: event.target.checked,
      }),
    onDisable: () => updateAppSettings('localServer', { enabled: false }),
    onEnable: () => updateAppSettings('localServer', { enabled: true }),
    onSearchPathChanged(event: ChangeEvent<HTMLInputElement>) {
      const paths = event.target.value.split('\n').map((item) => trim(item));
      const emptyItemIndex = paths.indexOf('');
      remove(paths, (item, index) => !item && index > emptyItemIndex);
      return updateAppSettings('localServer', { searchPath: paths });
    },
    onSelectSearchPath:
      window.bridge?.isElectron && window.bridge?.localServer?.selectPath
        ? (): AppThunk => async (dispatch, getState) => {
            const currentPaths = getLocalServerSearchPath(getState());
            const currentPath =
              Array.isArray(currentPaths) && currentPaths.length > 0
                ? currentPaths[0]
                : null;
            const path =
              await window.bridge!.localServer!.selectPath(currentPath);
            if (typeof path === 'string' && path.length > 0) {
              dispatch(
                updateAppSettings('localServer', { searchPath: [path] })
              );
            }
          }
        : undefined,
    onTextFieldChanged: (event: ChangeEvent<HTMLInputElement>) =>
      updateAppSettings('localServer', {
        [event.target.id]: event.target.value,
      } as Partial<SettingsState['localServer']>),
  }
)(ServerTabPresentation);
