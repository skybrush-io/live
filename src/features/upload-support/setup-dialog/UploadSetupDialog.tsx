import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { DraggableDialog } from '@skybrush/mui-components';

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
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='md'
      sidebarComponents={sidebar}
      sidebarPlacement='right'
      title={title}
      onClose={onClose}
    >
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('general.action.close')}</Button>
      </DialogActions>
    </DraggableDialog>
  );
};

export default UploadSetupDialog;
