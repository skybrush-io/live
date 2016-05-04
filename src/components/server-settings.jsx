/**
 * @file Dialog that shows the server settings and allows the user to
 * edit it.
 */

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';

class ServerSettingsDialogPresentation extends React.Component {
    render() {
        return (
            <Dialog title="Server Settings" modal={true} open={this.props.open}>
                Test contents
            </Dialog>
        );
    }
}

ServerSettingsDialogPresentation.propTypes = {
    open: PropTypes.bool.isRequired
};

ServerSettingsDialogPresentation.defaultProps = {
    open: false
};

function mapStateToProps(state) {
    return {
        open: state.serverSettings.dialogVisible
    };
}

const ServerSettingsDialog = connect(
    mapStateToProps
)(ServerSettingsDialogPresentation);

export default ServerSettingsDialog;
