import { MiniListItemButton } from '@skybrush/mui-components';
import { useCallback } from 'react';
import { useAppDispatch } from '~/store/hooks';
import { selectGroup } from './slice';
import type { SelectionGroup } from './types';

type Props = {
  group: SelectionGroup;
};

const SelectionGroupMiniListItem = ({ group }: Props) => {
  const { id, name } = group;
  const dispatch = useAppDispatch();

  const handleSelect = useCallback(() => {
    dispatch(selectGroup(id));
  }, [id, dispatch]);

  return (
    <MiniListItemButton
      key={id}
      iconPreset={`number${id}`}
      primaryText={name}
      onClick={handleSelect}
    />
  );
};

export default SelectionGroupMiniListItem;
