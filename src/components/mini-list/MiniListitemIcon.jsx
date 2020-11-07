import PropTypes from 'prop-types';
import React from 'react';

import Colors from '~/components/colors';
import { ConnectionState } from '~/model/connections';

import ListItemIcon from '@material-ui/core/ListItemIcon';
import ActionDone from '@material-ui/icons/Done';
import ActionSettingsEthernet from '@material-ui/icons/SettingsEthernet';
import ContentClear from '@material-ui/icons/Clear';
import PriorityHigh from '@material-ui/icons/PriorityHigh';

const presets = {
  [ConnectionState.CONNECTED]: {
    color: Colors.success,
    icon: <ActionDone fontSize='small' />,
  },
  [ConnectionState.CONNECTING]: {
    color: Colors.warning,
    icon: <ActionSettingsEthernet fontSize='small' />,
  },
  [ConnectionState.DISCONNECTED]: {
    color: Colors.error,
    icon: <ContentClear fontSize='small' />,
  },
  [ConnectionState.DISCONNECTING]: {
    color: Colors.warning,
    icon: <ActionSettingsEthernet fontSize='small' />,
  },

  empty: {},

  success: {
    color: Colors.success,
    icon: <ActionDone fontSize='small' />,
  },

  warning: {
    color: Colors.warning,
    icon: <PriorityHigh fontSize='small' />,
  },
};

/**
 * Small icon to be used on the left edge of a mini list.
 */
const MiniListItemIcon = ({ color, children, preset, style, ...rest }) => {
  if (preset) {
    const { icon, color: presetColor } = presets[preset] || {};

    if (!children) {
      children = icon;
    }

    if (!color) {
      color = presetColor;
    }
  }

  const effectiveStyle = {
    color,
    minWidth: 28,
    ...style,
  };

  return (
    <ListItemIcon style={effectiveStyle} {...rest}>
      {children}
    </ListItemIcon>
  );
};

MiniListItemIcon.presets = presets;

MiniListItemIcon.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  color: PropTypes.string,
  preset: PropTypes.oneOf(Object.keys(presets)),
  style: PropTypes.object,
};

export default MiniListItemIcon;
