import Clear from '@mui/icons-material/Clear';
import Button, { type ButtonProps } from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '~/store/hooks';

import { cancelUpload } from './slice';

const CancelUploadButton = (props: ButtonProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  return (
    <Button
      color='secondary'
      startIcon={<Clear />}
      onClick={() => {
        dispatch(cancelUpload());
      }}
      {...props}
    >
      {t('uploadPanel.cancelUpload')}
    </Button>
  );
};

export default CancelUploadButton;
