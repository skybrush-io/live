import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { DraggableDialog } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import ConsistencyCheckMainPanel from './ConsistencyCheckMainPanel';
import ConsistencyCheckNameSidebar from './ConsistencyCheckNameSidebar';
import { isConsistencyCheckSetupDialogOpen } from './selectors';
import { closeConsistencyCheckSetupDialog } from './slice';

/* Ugly hack to move the sidebar to the right */
const useStyles = makeStyles({
  root: {
    '& div.MuiDialog-paper > div > div:first-child': {
      order: 100,
      boxShadow: '2px 0 6px -2px inset rgba(0, 0, 0, 0.54)',
    },
  },
  dialogContent: {
    paddingBottom: 0,
  },
});

type Props = {
  onClose: () => void;
  open: boolean;
};

/**
 * Presentation component for the dialog that allows the user to assemble a
 * list of parameter names to check across the drones.
 */
const ConsistencyCheckSetupDialog = ({ onClose, open }: Props) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <DraggableDialog
      fullWidth
      className={classes.root}
      open={open}
      maxWidth='md'
      sidebarComponents={<ConsistencyCheckNameSidebar />}
      title={t('consistencyCheckSetupDialog.checkParameters')}
      onClose={onClose}
    >
      <DialogContent className={classes.dialogContent}>
        <ConsistencyCheckMainPanel />
        <DialogActions>
          <Button onClick={onClose}>{t('general.action.close')}</Button>
        </DialogActions>
      </DialogContent>
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    open: isConsistencyCheckSetupDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeConsistencyCheckSetupDialog,
  }
)(ConsistencyCheckSetupDialog);
