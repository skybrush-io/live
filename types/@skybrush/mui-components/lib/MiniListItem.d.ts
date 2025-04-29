import type * as React from 'react';
import { type MiniListItemIconProps } from '@skybrush/mui-components/lib/MiniListItemIcon';

type MiniListItemProps = {
  icon?: React.ReactNode;
  iconPreset?: MiniListItemIconProps['preset'];
  primaryText?: React.ReactNode;
  secondaryText?: React.ReactNode;
};

/**
 * Generic list item to be used in the "mini-lists" that appear in popup
 * tooltips, typically in the app header.
 */
declare const MiniListItem: (props: MiniListItemProps) => React.JSX.Element;
export default MiniListItem;
