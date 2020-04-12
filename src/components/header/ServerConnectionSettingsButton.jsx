import ConnectionIcon from '@material-ui/icons/Power';

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import ServerConnectionStatusBadge from '../badges/ServerConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import { showServerSettingsDialog } from '~/actions/server-settings';

export default (props) => {
  const dispatch = useDispatch();
  const onClick = useCallback(() => dispatch(showServerSettingsDialog()), [
    dispatch
  ]);
  return (
    <GenericHeaderButton {...props} onClick={onClick}>
      <ServerConnectionStatusBadge />
      <ConnectionIcon />
    </GenericHeaderButton>
  );
};
