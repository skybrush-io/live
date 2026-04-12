import Divider from '@mui/material/Divider';
import Menu, { type MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~/store/hooks';

import SelectionGroupMenuItem from './SelectionGroupMenuItem';
import { getOrderedSelectionGroups } from './selectors';
import { saveCurrentSelectionAsGroup } from './slice';

type Props = Omit<MenuProps, 'onClose'> & {
  requestClose: () => void;
};

const SelectionGroupMenu = ({ requestClose, ...rest }: Props) => {
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
      <MenuItem onClick={saveSelection}>{t('action.createNew')}</MenuItem>
      {selectionGroups.length > 0 && (
        <>
          <Divider />
          <MenuItem disabled>
            <Typography>{t('label')}</Typography>
          </MenuItem>
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
