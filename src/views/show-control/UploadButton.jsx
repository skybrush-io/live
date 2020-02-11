import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
// import LinearProgress from '@material-ui/core/LinearProgress';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * React component for the button that allows the user to start or stop the
 * upload process of the current show to the drones.
 */
const UploadButton = ({ status, ...rest }) => (
  <ListItem button disabled={status === StepperStatus.OFF} {...rest}>
    <StepperStatusLight status={status} />
    <ListItemText
      disableTypography
      primary="Upload show data"
      secondary={
        <Box
          minHeight={20.1}
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Typography component="div" variant="body2" color="textSecondary">
            {/* }<LinearProgress /> */}
            Click here to start the upload process
          </Typography>
        </Box>
      }
    />
  </ListItem>
);

UploadButton.propTypes = {
  status: PropTypes.oneOf(Object.values(StepperStatus))
};

export default connect(
  // mapStateToProps
  state => ({
    status: getSetupStageStatuses(state).uploadShow
  }),
  // mapDispatchToProps
  {}
)(UploadButton);
