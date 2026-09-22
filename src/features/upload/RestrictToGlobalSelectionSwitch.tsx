import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '~/store/hooks';
import { shouldRestrictToGlobalSelection } from './selectors';
import { toggleRestrictToGlobalSelection } from './slice';

const RestrictToGlobalSelectionSwitch = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const checked = useSelector(shouldRestrictToGlobalSelection);

  return (
    <Stack direction='row' sx={{ alignItems: 'center' }}>
      <Typography variant='body2'>
        {t('uploadDialog.restrictToGlobalSelection')}
      </Typography>
      <Switch
        checked={checked}
        onChange={(evt) => {
          dispatch(toggleRestrictToGlobalSelection());
          evt.target.blur();
        }}
      />
    </Stack>
  );
};

export default RestrictToGlobalSelectionSwitch;
