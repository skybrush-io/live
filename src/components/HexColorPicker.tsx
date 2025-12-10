import { styled } from '@mui/material/styles';
import {
  HexColorInput as _HexColorInput,
  HexColorPicker as _HexColorPicker,
} from 'react-colorful';

export const HexColorInput = styled(_HexColorInput)(({ theme }) => ({
  background: theme.palette.action.hover,
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.primary,
  padding: theme.spacing(1),
  textAlign: 'center',
  textTransform: 'uppercase',

  '&:focus': {
    outline: 'none',
  },
}));

export const HexColorPicker = styled(_HexColorPicker)(({ theme }) => ({
  padding: theme.spacing(1, 0),
}));
