import {
  MiniList,
  MiniListDivider,
  MiniListItem,
  MiniListItemButton,
} from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~/store/hooks';

import { saveCurrentSelectionAsGroupIfNotEmpty } from './actions';
import SelectionGroupMiniListItem from './SelectionGroupMiniListItem';
import {
  getNumberOfSelectedItems,
  getOrderedSelectionGroups,
  hasSelection,
} from './selectors';

const SelectionGroupMiniList = () => {
  const isSelectionNotEmpty = useSelector(hasSelection);
  const numberOfSelectedItems = useSelector(getNumberOfSelectedItems);
  const selectionGroups = useSelector(getOrderedSelectionGroups);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  return (
    <MiniList sx={{ minWidth: 200 }}>
      <MiniListItem
        primaryText={t('selectedObjects')}
        secondaryText={String(numberOfSelectedItems)}
        inset={1}
      />
      <MiniListDivider inset={1} />
      {selectionGroups.map((group) => (
        <SelectionGroupMiniListItem key={group.id} group={group} />
      ))}
      {selectionGroups.length > 0 && <MiniListDivider inset={1} />}
      <MiniListItemButton
        disabled={!isSelectionNotEmpty}
        onClick={() => {
          dispatch(saveCurrentSelectionAsGroupIfNotEmpty());
        }}
        iconPreset='add'
        inset={1}
        primaryText={t('action.createNew')}
      />
    </MiniList>
  );
};

export default SelectionGroupMiniList;
