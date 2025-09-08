import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Variant on the Material-UI list item component that is styled in a way that
 * we can place a `<LinearProgress />` component in the secondary text without
 * messing up the layout.`
 */
const ListItemTextWithProgress = ({ secondary, ...rest }) => (
  <ListItemText
    {...rest}
    disableTypography
    secondary={
      <Box
        minHeight={20.1}
        display='flex'
        flexDirection='column'
        justifyContent='center'
      >
        <Typography component='div' variant='body2' color='textSecondary'>
          {secondary}
        </Typography>
      </Box>
    }
  />
);

ListItemTextWithProgress.propTypes = {
  secondary: PropTypes.node,
};

export default ListItemTextWithProgress;
