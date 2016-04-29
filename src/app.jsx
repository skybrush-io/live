import React from 'react';

import RaisedButton from 'material-ui/RaisedButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import MapView from './map';


require('../assets/css/screen.less');

const muiTheme = getMuiTheme({});
const styles = {
    button: {
        position: "absolute",
        bottom: "20px",
        right: "20px"
    }
}

export default class Application extends React.Component {
    render() {
        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <div>
                    <MapView />
                    <RaisedButton label="Button" style={styles.button} />
                </div>
            </MuiThemeProvider>
        );
    }
}
