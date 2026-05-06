import {
  MiniList,
  MiniListDivider,
  MiniListItemButton,
  MiniListItem,
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

const listStyle = {
  minWidth: 200,
};

const SelectionGroupMiniList = () => {
  const isSelectionNotEmpty = useSelector(hasSelection);
  const numberOfSelectedItems = useSelector(getNumberOfSelectedItems);
  const selectionGroups = useSelector(getOrderedSelectionGroups);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  return (
    <MiniList style={listStyle}>
      <MiniListItem
        primaryText={t('selectedObjects')}
        secondaryText={String(numberOfSelectedItems)}
      />
      <MiniListDivider />
      {selectionGroups.map((group) => (
        <SelectionGroupMiniListItem key={group.id} group={group} />
      ))}
      {selectionGroups.length > 0 && <MiniListDivider />}
      <MiniListItemButton
        onClick={
          isSelectionNotEmpty
            ? () => {
                dispatch(saveCurrentSelectionAsGroupIfNotEmpty());
              }
            : undefined
        }
        iconPreset='add'
        primaryText={t('action.createNew')}
      />
    </MiniList>
  );
};

export default SelectionGroupMiniList;
