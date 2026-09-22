import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ListSubheader from '@mui/material/ListSubheader';
import type React from 'react';

export type UAVListSubheaderProps = Readonly<{
  className?: string;
  label: string;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> &
  Omit<CheckboxProps, 'onSelect'>;

const UAVListSubheader = ({
  className,
  label,
  onSelect,
  ...rest
}: UAVListSubheaderProps): React.JSX.Element => (
  <ListSubheader disableSticky className={className}>
    <FormControlLabel
      control={<Checkbox size='small' onChange={onSelect} {...rest} />}
      label={label}
    />
  </ListSubheader>
);

export default UAVListSubheader;
