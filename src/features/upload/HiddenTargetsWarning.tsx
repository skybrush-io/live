import Alert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { hasHiddenTargets } from './selectors';

const HiddenTargetsWarning = () => {
  const { t } = useTranslation();
  const hasHidden = useSelector(hasHiddenTargets);
  return (
    hasHidden && (
      <Alert severity='warning' variant='filled'>
        {t('uploadPanel.hasHiddenTargets')}
      </Alert>
    )
  );
};

export default HiddenTargetsWarning;
