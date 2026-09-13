import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import { createSecondaryAreaStyle, makeStyles } from '@skybrush/app-theme-mui';

import CollectiveRTHDialogActions from './CollectiveRTHDialogActions';
import RTHPlanSummary from './RTHPlanSummary';

const useStyles = makeStyles((theme: Theme) => ({
  bottomArea: {
    ...createSecondaryAreaStyle(theme, { inset: 'top' }),
    padding: theme.spacing(2, 0, 1, 0),
  },
}));

const CollectiveRTHDialogBottomArea = () => {
  const classes = useStyles();
  return (
    <Stack className={classes.bottomArea}>
      <RTHPlanSummary />
      <CollectiveRTHDialogActions />
    </Stack>
  );
};

export default CollectiveRTHDialogBottomArea;
