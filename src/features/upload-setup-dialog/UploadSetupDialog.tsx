import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@skybrush/app-theme-mui';
import { DraggableDialog } from '@skybrush/mui-components';

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
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  sidebar: ReactNode;
  title: string;
};

/**
 * Upload setup dialog with a right-aligned sidebar and a body consisting
 * of the main dialog content and a close button wrapped in `DialogActions`.
 */
const UploadSetupDialog = ({
  children,
  onClose,
  open,
  sidebar,
  title,
}: Props) => {
  const { t } = useTranslation();
  const classes = useStyles();

  return (
    <DraggableDialog
      fullWidth
      className={classes.root}
      open={open}
      maxWidth='md'
      sidebarComponents={sidebar}
      title={title}
      onClose={onClose}
    >
      <DialogContent className={classes.dialogContent}>
        {children}
        <DialogActions>
          <Button onClick={onClose}>{t('general.action.close')}</Button>
        </DialogActions>
      </DialogContent>
    </DraggableDialog>
  );
};

export default UploadSetupDialog;
