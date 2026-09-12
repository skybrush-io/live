import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import { createSecondaryAreaStyle, makeStyles } from '@skybrush/app-theme-mui';

import CollectiveRTHDialogActions from './CollectiveRTHDialogActions';
import RTHPlanProgressIndicator from './RTHPlanProgressIndicator';
import RTHPlanTaskResultSummary from './RTHPlanTaskResultSummary';

const useStyles = makeStyles((theme: Theme) => ({
  bottomArea: {
    ...createSecondaryAreaStyle(theme, { inset: 'top' }),
    padding: theme.spacing(2, 3, 1, 3),
  },
}));

const CollectiveRTHDialogBottomArea = () => {
  const classes = useStyles();
  return (
    <Stack className={classes.bottomArea} gap={1}>
      <RTHPlanProgressIndicator />
      <RTHPlanTaskResultSummary />
      <CollectiveRTHDialogActions />
    </Stack>
  );
};

export default CollectiveRTHDialogBottomArea;
