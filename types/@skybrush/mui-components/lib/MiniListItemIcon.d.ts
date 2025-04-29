import type * as React from 'react';

import { type ListItemIconProps } from '@material-ui/core/ListItemIcon';

declare const presets: Record<
  string,
  {
    color?: string;
    icon?: React.ReactNode;
  }
>;

export type MiniListItemIconProps = ListItemIconProps & {
  color?: string;
  preset?: keyof typeof presets;
};

declare const MiniListItemIcon: {
  (props: MiniListItemIconProps): React.JSX.Element;
  presets: Record<
    string,
    {
      color?: string | undefined;
      icon?: React.ReactNode;
    }
  >;
};
export default MiniListItemIcon;
