import React from 'react';
import Badge from 'react-badger';

const badgeProps = {
  offset: [8, 8],
};

/**
 * Special variant of badges shown on the sidebar.
 */
const SidebarBadge = (props) => <Badge {...badgeProps} {...props} />;

export default SidebarBadge;
