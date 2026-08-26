import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ItemListSidebar from '~/features/upload-support/setup-dialog/ItemListSidebar';
import type { RootState } from '~/store/reducers';

import {
  importConsistencyCheckNamesFromFile,
  proceedToConsistencyCheck,
} from './actions';
import {
  getConsistencyCheckNameList,
  isConsistencyCheckNameListEmpty,
} from './selectors';
import type { ConsistencyCheckParameterNameItem } from './slice';
import {
  clearConsistencyCheckParameterNames,
  removeParameterNameFromConsistencyCheckList,
} from './slice';

/**
 * Sidebar of the parameter consistency-check setup dialog.
 */
const ConsistencyCheckSidebar = ({
  canProceed,
  names,
  onImportItems,
  onRemoveAllItems,
  onRemoveItem,
  onStart,
}: Props) => {
  const { t } = useTranslation();

  const renderItem = (item: ConsistencyCheckParameterNameItem) => (
    <Box sx={{ flexGrow: 1 }}>{item.name}</Box>
  );

  return (
    <ItemListSidebar
      canProceed={canProceed}
      importLabel={t('consistencyCheck.sidebar.import')}
      proceedLabel={t('consistencyCheck.sidebar.nextStep')}
      removeAllLabel={t('consistencyCheck.sidebar.removeAllItems')}
      items={names}
      renderItem={renderItem}
      title={t('consistencyCheck.sidebar.title')}
      onImportItems={onImportItems}
      onRemoveAllItems={onRemoveAllItems}
      onRemoveItem={onRemoveItem}
      onStart={onStart}
    />
  );
};

type Props = {
  canProceed: boolean;
  names: ConsistencyCheckParameterNameItem[];
  onImportItems: (file?: File) => Promise<void>;
  onRemoveAllItems: () => void;
  onRemoveItem: (id: ConsistencyCheckParameterNameItem['id']) => void;
  onStart: () => Promise<void>;
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canProceed: !isConsistencyCheckNameListEmpty(state),
    names: getConsistencyCheckNameList(state),
  }),
  // mapDispatchToProps
  {
    onImportItems: importConsistencyCheckNamesFromFile,
    onRemoveAllItems: clearConsistencyCheckParameterNames,
    onRemoveItem: removeParameterNameFromConsistencyCheckList,
    onStart: proceedToConsistencyCheck,
  }
)(ConsistencyCheckSidebar);
