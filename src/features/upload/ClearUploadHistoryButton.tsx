import Delete from '@mui/icons-material/Delete';
import Button, { type ButtonProps } from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '~/store/hooks';
import { clearUploadHistoryForCurrentJobType } from './slice';

const ClearUploadHistoryButton = (props: ButtonProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  return (
    <Button
      startIcon={<Delete />}
      onClick={() => {
        dispatch(clearUploadHistoryForCurrentJobType());
      }}
      {...props}
    >
      {t('uploadPanel.clearHistory')}
    </Button>
  );
};

export default ClearUploadHistoryButton;
