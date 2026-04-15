import DarkModeIcon from '@mui/icons-material/Brightness4';
import type { ToggleButtonProps } from '@mui/material/ToggleButton';

import ToggleButton from './ToggleButton';

type DarkModeSwitchProps = {
  selected: boolean;
  onChange: ToggleButtonProps['onChange'];
};

const DarkModeSwitch = ({ onChange, selected }: DarkModeSwitchProps) => (
  <ToggleButton value='dark' selected={selected} onChange={onChange}>
    <DarkModeIcon />
  </ToggleButton>
);

export default DarkModeSwitch;
