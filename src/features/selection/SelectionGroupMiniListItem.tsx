import { MiniListItemButton, MiniListItemIcon } from '@skybrush/mui-components';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '~/store/hooks';
import { callAndHandleErrors } from '~/error-handling';
import { showPromptDialog } from '../prompt/actions';
import { saveCurrentSelectionAsGroupIfNotEmpty } from './actions';
import { hasSelection } from './selectors';
import { deleteGroup, selectGroup, updateGroup } from './slice';
import type { SelectionGroup } from './types';

type Props = {
  group: SelectionGroup;
};

const SelectionGroupMiniListItem = ({ group }: Props) => {
  const { id, name } = group;
  const dispatch = useAppDispatch();
  const isSelectionNotEmpty = useSelector(hasSelection);
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  const handleSelect = useCallback(() => {
    dispatch(selectGroup(id));
  }, [id, dispatch]);

  const handleRename = useCallback(async () => {
    const result = await dispatch(
      showPromptDialog({
        title: t('action.rename'),
        initialValues: { name },
        schema: {
          type: 'object',
          properties: {
            name: {
              title: t('label.name'),
              type: 'string',
            },
          },
        },
      })
    );
    if (result) {
      const newName = result?.name;
      if (newName && newName.length > 0) {
        dispatch(updateGroup({ id, data: { name: newName } }));
      }
    }
  }, [id, dispatch, name, t]);

  const handleUpdate = useCallback(() => {
    dispatch(saveCurrentSelectionAsGroupIfNotEmpty(id));
    setRecentlyUpdated(true);
  }, [id, name, dispatch, setRecentlyUpdated]);

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
            <MiniListItemIcon preset='empty' />
          </>
        ) : (
          <>
            <MiniListItemIcon
              preset='edit'
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                callAndHandleErrors(handleRename);
              }}
            />
            {isSelectionNotEmpty && (
              <MiniListItemIcon preset='save' onClick={handleUpdate} />
            )}
            <MiniListItemIcon preset={'delete'} onClick={handleDelete} />
          </>
        )
      }
      showSecondaryActions='hover'
      onClick={handleSelect}
    />
  );
};

export default SelectionGroupMiniListItem;
