import React from 'react';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import CloudUpload from '@material-ui/icons/CloudUpload';
import Edit from '@material-ui/icons/Edit';
import PlayArrow from '@material-ui/icons/PlayArrow';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanel = () => {
  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box style={{ overflow: 'auto' }} flex={1}>
        <List dense>
          <ListItem button>
            <ListItemText
              primary="No show file loaded"
              secondary="Click here to open a show file"
            />
          </ListItem>
          <Divider />
          <ListItem button disabled>
            <ListItemText primary="Environment" secondary="Outdoor" />
            <ListItemSecondaryAction>
              <IconButton disabled edge="end">
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem button disabled>
            <ListItemText
              primary="Drone swarm"
              secondary="Use virtual drones"
            />
          </ListItem>
          <Divider />
          <ListItem button disabled>
            <ListItemText primary="Start time" secondary="Not set yet" />
          </ListItem>
          <ListItem button disabled>
            <ListItemText
              primary="Start signal"
              secondary="Remote controller"
            />
          </ListItem>
        </List>
      </Box>

      <Box
        className="bottom-bar"
        display="flex"
        justifyContent="space-around"
        py={2}
        px={2}
      >
        <Button
          disabled
          variant="contained"
          color="primary"
          startIcon={<CloudUpload />}
        >
          Upload
        </Button>
        <Button
          disabled
          variant="contained"
          color="secondary"
          startIcon={<PlayArrow />}
        >
          Start
        </Button>
      </Box>
    </Box>
  );
};

export default ShowControlPanel;
