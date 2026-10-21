import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { getUIScale } from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import type { RootState } from '~/store/reducers';

const uiScales = [0.8, 0.9, 1, 1.1, 1.25, 1.5];

type Props = {
  uiScale: number;
  onChange: (event: SelectChangeEvent<number>) => void;
};

const UIScaleSelect = ({ uiScale, onChange }: Props) => {
  const { i18n, t } = useTranslation();

  if (!window.bridge?.isElectron) {
    return null;
  }

  const options = uiScales.includes(uiScale)
    ? uiScales
    : [...uiScales, uiScale].sort((a, b) => a - b);

  return (
    <FormControl fullWidth variant='filled'>
      <InputLabel id='ui-scale-label'>
        {t('settings.display.uiScale')}
      </InputLabel>
      <Select labelId='ui-scale-label' value={uiScale} onChange={onChange}>
        {options.map((value) => (
          <MenuItem key={value} value={value}>
            {value.toLocaleString(i18n.language, { style: 'percent' })}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    uiScale: getUIScale(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onChange(event: SelectChangeEvent<number>) {
      dispatch(
        updateAppSettings('display', { uiScale: Number(event.target.value) })
      );
    },
  })
)(UIScaleSelect);
