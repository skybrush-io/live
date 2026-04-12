import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import Menu, { type MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~/store/hooks';

import SelectionGroupMenuItem from './SelectionGroupMenuItem';
import { getOrderedSelectionGroups, hasSelection } from './selectors';
import { saveCurrentSelectionAsGroup } from './slice';

type Props = Omit<MenuProps, 'onClose'> & {
  requestClose: () => void;
};

const SelectionGroupMenu = ({ requestClose, ...rest }: Props) => {
  const isSelectionNotEmpty = useSelector(hasSelection);
  const selectionGroups = useSelector(getOrderedSelectionGroups);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  const saveSelection = useCallback(() => {
    dispatch(saveCurrentSelectionAsGroup());
    requestClose();
  }, [requestClose, dispatch]);

  return (
    <Menu onClose={requestClose} {...rest}>
      <MenuItem onClick={saveSelection} disabled={!isSelectionNotEmpty}>
        {t('action.createNew')}
      </MenuItem>
      {selectionGroups.length > 0 && (
        <>
          <Divider />
          <ListSubheader>{t('label')}</ListSubheader>
          {selectionGroups.map((g) => (
            <SelectionGroupMenuItem
              key={g.name}
              group={g}
              onClick={() => {
                requestClose();
              }}
            />
          ))}
        </>
      )}
    </Menu>
  );
};

export default SelectionGroupMenu;
