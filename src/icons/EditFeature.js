import React from 'react';
import pure from 'recompose/pure';
import SvgIcon from '@material-ui/core/SvgIcon';

const SvgIconCustom = global.__MUI_SvgIcon__ || SvgIcon;

let EditFeature = props => (
  <SvgIconCustom {...props}>
    <path d="M3 3 L20.38 15.16 L15.16 20.38 L3 3z" />
  </SvgIconCustom>
);

EditFeature = pure(EditFeature);
EditFeature.muiName = 'SvgIcon';

export default EditFeature;
