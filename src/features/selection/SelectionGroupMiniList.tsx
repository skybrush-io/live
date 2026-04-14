import {
  MiniList,
  MiniListDivider,
  MiniListItemButton,
} from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~/store/hooks';

import { saveCurrentSelectionAsGroupIfNotEmpty } from './actions';
import SelectionGroupMiniListItem from './SelectionGroupMiniListItem';
import { getOrderedSelectionGroups, hasSelection } from './selectors';

const listStyle = {
  minWidth: 200,
};

const SelectionGroupMiniList = () => {
  const isSelectionNotEmpty = useSelector(hasSelection);
  const selectionGroups = useSelector(getOrderedSelectionGroups);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  return (
    <MiniList style={listStyle}>
      {selectionGroups.map((group) => (
        <SelectionGroupMiniListItem key={group.id} group={group} />
      ))}
      {selectionGroups.length > 0 && <MiniListDivider />}
      <MiniListItemButton
        disabled={!isSelectionNotEmpty}
        onClick={() => {
          dispatch(saveCurrentSelectionAsGroupIfNotEmpty());
        }}
        iconPreset='add'
        primaryText={t('action.createNew')}
      />
    </MiniList>
  );
};

export default SelectionGroupMiniList;
