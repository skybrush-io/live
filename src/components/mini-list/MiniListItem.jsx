import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';

import MiniListItemIcon from './MiniListitemIcon';

/**
 * Generic list item to be used in the "mini-lists" that appear in popup
 * tooltips, typically in the app header.
 */
const MiniListItem = ({ icon, iconPreset, primaryText, secondaryText }) => (
  <ListItem disableGutters>
    {iconPreset ? <MiniListItemIcon preset={iconPreset} /> : icon}
    {secondaryText ? (
      <Box display='flex' flexDirection='row' flexGrow={1}>
        <Box flexGrow={1}>{primaryText}</Box>
        <Box color='text.secondary' ml={1}>
          {secondaryText}
        </Box>
      </Box>
    ) : (
      primaryText
    )}
  </ListItem>
);

MiniListItem.propTypes = {
  icon: PropTypes.node,
  iconPreset: PropTypes.oneOf(Object.keys(MiniListItemIcon.presets)),
  primaryText: PropTypes.node,
  secondaryText: PropTypes.node,
};

export default MiniListItem;
