import React from 'react';
import { Provider as StoreProvider } from 'react-redux';

import Avatar from 'material-ui/Avatar';
import { colors } from 'material-ui/styles';
import IconButton from 'material-ui/IconButton';
import { List, ListItem } from 'material-ui/List';
import Paper from 'material-ui/Paper';
import Subheader from 'material-ui/Subheader';

import ActionDone from 'material-ui/svg-icons/action/done';
import ActionSettings from 'material-ui/svg-icons/action/settings';
import ActionSettingsEthernet from 'material-ui/svg-icons/action/settings-ethernet';
import ContentClear from 'material-ui/svg-icons/content/clear';

import RaisedButton from 'material-ui/RaisedButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import ServerSettingsDialog from './components/server-settings';
import MapView from './components/map';

import { showServerSettingsDialog } from './actions';
import store from './store';

require('../assets/css/screen.less');

/**
 * The Material UI theme that the application will use.
 */
const muiTheme = getMuiTheme({});

const serverSettingsButton = (
    <IconButton onClick={() => store.dispatch(showServerSettingsDialog())}>
        <ActionSettings/>
    </IconButton>
);

/**
 * The main application component.
 */
export default class Application extends React.Component {
    render() {
        return (
            <StoreProvider store={store}>
                <MuiThemeProvider muiTheme={muiTheme}>
                    <div>
                        <div id="canvas">
                            <MapView />
                            <Paper className="widget"
                                style={{ "right": 20, "top": 20, "width": 300 }}>
                                <div className="widget-action-bar">
                                    <IconButton><ContentClear/></IconButton>
                                </div>
                                <List>
                                    <Subheader text="Connections" />
                                    <ListItem leftAvatar={<Avatar icon={<ContentClear/>} backgroundColor={colors.redA700}/>} rightIconButton={serverSettingsButton} primaryText="flockwave.collmot.com" secondaryText="Disconnected since 07:14" />
                                    <ListItem leftAvatar={<Avatar icon={<ActionDone/>} color={colors.green500} backgroundColor={colors.white}/>} primaryText="XBee" secondaryText="Connected since 07:14"/>
                                    <ListItem leftAvatar={<Avatar icon={<ActionSettingsEthernet/>} color={colors.black} backgroundColor={colors.yellow500}/>} primaryText="DGPS" secondaryText="Connection in progress..." />
                                </List>
                            </Paper>
                        </div>
                        <div id="footer">
                            <RaisedButton id="connectButton" label="Button" />
                        </div>

                        <ServerSettingsDialog/>
                    </div>
                </MuiThemeProvider>
            </StoreProvider>
        );
    }
}
