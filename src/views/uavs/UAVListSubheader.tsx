import React from 'react';

import Checkbox, { type CheckboxProps } from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import ListSubheader from '@material-ui/core/ListSubheader';

export type UAVListSubheaderProps = Readonly<{
  label: string;
  onSelect: (
    event: React.SyntheticEvent<HTMLInputElement | HTMLButtonElement>
  ) => void;
}> &
  CheckboxProps;

const UAVListSubheader = ({
  label,
  onSelect,
  ...rest
}: UAVListSubheaderProps): JSX.Element => (
  <ListSubheader disableSticky>
    <FormControlLabel
      control={<Checkbox size='small' onChange={onSelect} {...rest} />}
      label={label}
    />
  </ListSubheader>
);

export default UAVListSubheader;
