import { remove, trim } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import FormGroup from '@material-ui/core/FormGroup';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import { updateAppSettings } from '../../../actions/app-settings';
import PathScanner from './PathScanner';

const ServerTabPresentation = ({
  cliArguments,
  enabled,
  onDisable,
  onEnable,
  onSearchPathChanged,
  onTextFieldChanged,
  searchPath
}) => (
  <>
    <List dense disablePadding style={{ margin: '0 -24px' }}>
      <PathScanner />
      <ListItem button disableRipple onClick={enabled ? onDisable : onEnable}>
        <Switch checked={enabled} />
        <ListItemText
          primary="Launch local server at startup"
          secondary="Local server will be launched only if the application
          is set to connect to localhost"
        />
      </ListItem>
    </List>
    <FormGroup>
      <TextField
        fullWidth
        id="cliArguments"
        label="Command line arguments"
        value={cliArguments}
        helperText={
          'These arguments will be supplied to the local server ' +
          'upon startup.'
        }
        onChange={onTextFieldChanged}
      />
      <TextField
        fullWidth
        multiline
        id="searchPath"
        label="Search path"
        value={searchPath}
        helperText={
          'Enter directories to search for the Flockwave server ' +
          'executable, one per line.'
        }
        onChange={onSearchPathChanged}
      />
    </FormGroup>
  </>
);

ServerTabPresentation.propTypes = {
  cliArguments: PropTypes.string,
  enabled: PropTypes.bool,
  onCheckboxToggled: PropTypes.func,
  onDisable: PropTypes.func,
  onEnable: PropTypes.func,
  onSearchPathChanged: PropTypes.func,
  onTextFieldChanged: PropTypes.func,
  searchPath: PropTypes.string
};

export default connect(
  // MapStateToProps
  state => ({
    ...state.settings.localServer,
    searchPath: state.settings.localServer.searchPath.join('\n')
  }),
  // MapDispatchToProps
  dispatch => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('localServer', {
          [event.target.name]: event.target.checked
        })
      );
    },

    onDisable() {
      dispatch(updateAppSettings('localServer', { enabled: false }));
    },

    onEnable() {
      dispatch(updateAppSettings('localServer', { enabled: true }));
    },

    onSearchPathChanged(event) {
      const paths = event.target.value.split('\n').map(item => trim(item));
      const emptyItemIndex = paths.indexOf('');
      remove(paths, (item, index) => !item && index > emptyItemIndex);
      dispatch(updateAppSettings('localServer', { searchPath: paths }));
    },

    onTextFieldChanged(event) {
      dispatch(
        updateAppSettings('localServer', {
          [event.target.id]: event.target.value
        })
      );
    }
  })
)(ServerTabPresentation);
