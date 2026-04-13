import { MiniListItemButton, MiniListItemIcon } from '@skybrush/mui-components';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '~/store/hooks';
import { deleteGroup, saveCurrentSelectionAsGroup, selectGroup } from './slice';
import type { SelectionGroup } from './types';

type Props = {
  group: SelectionGroup;
};

const SelectionGroupMiniListItem = ({ group }: Props) => {
  const { id, name } = group;
  const dispatch = useAppDispatch();
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  const handleSelect = useCallback(() => {
    dispatch(selectGroup(id));
  }, [id, dispatch]);

  const handleUpdate = useCallback(() => {
    dispatch(saveCurrentSelectionAsGroup(id));
    setRecentlyUpdated(true);
  }, [id, dispatch, setRecentlyUpdated]);

  const handleDelete = useCallback(() => {
    dispatch(deleteGroup(id));
  }, [id, dispatch]);

  // Revert recentlyUpdated to false after 3 seconds
  useEffect(() => {
    const timeoutId = recentlyUpdated
      ? setTimeout(() => {
          setRecentlyUpdated(false);
        }, 3000)
      : undefined;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [recentlyUpdated, setRecentlyUpdated]);

  return (
    <MiniListItemButton
      key={id}
      iconPreset={recentlyUpdated ? 'success' : `number${id}`}
      primaryText={recentlyUpdated ? t('updated') : name}
      secondaryActions={
        recentlyUpdated ? (
          <>
            <MiniListItemIcon preset='empty' />
            <MiniListItemIcon preset='empty' />
          </>
        ) : (
          <>
            <MiniListItemIcon preset='update' onClick={handleUpdate} />
            <MiniListItemIcon preset={'delete'} onClick={handleDelete} />
          </>
        )
      }
      onClick={handleSelect}
    />
  );
};

export default SelectionGroupMiniListItem;
