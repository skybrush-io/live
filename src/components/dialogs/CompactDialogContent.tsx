import React from 'react';

import DialogContent, {
  type DialogContentProps,
} from '@mui/material/DialogContent';

const sxSmallVerticalPadding = {
  paddingBottom: 0.5,
  paddingTop: 0.5,
};

function CompactDialogContent({ sx, ...props }: DialogContentProps) {
  const effectiveSx =
    sx === undefined
      ? sxSmallVerticalPadding
      : { ...sxSmallVerticalPadding, ...sx };
  return <DialogContent sx={effectiveSx} {...props} />;
}

export default CompactDialogContent;
