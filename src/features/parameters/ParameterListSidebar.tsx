import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ItemListSidebar from '~/components/ItemListSidebar';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import Stack from '@mui/material/Stack';
import { importParametersFromFile, proceedToUpload } from './actions';
import { getParameterManifest, isManifestEmpty } from './selectors';
import { clearManifest, removeParameterFromManifest } from './slice';
import type { Parameter } from './types';

type Props = {
  canUpload: boolean;
  manifest: Parameter[];
  onImportItems: (file?: File) => Promise<void>;
  onRemoveAllItems: () => void;
  onRemoveItem: (id: Identifier) => void;
  onStart: () => Promise<void>;
};

/**
 * Sidebar of the parameter upload setup dialog.
 */
const ParameterListSidebar = ({
  canUpload,
  manifest,
  onImportItems,
  onRemoveItem,
  onRemoveAllItems,
  onStart,
}: Props) => {
  const { t } = useTranslation();

  const renderItem = (item: Parameter) => (
    <Stack spacing={1} direction='row' sx={{ width: '100%' }}>
      <Box sx={{ flexGrow: 1 }}>
        {item.uavId === undefined ? item.name : `${item.name} (${item.uavId})`}
      </Box>
      <Box sx={{ color: 'text.secondary' }}>{item.value}</Box>
    </Stack>
  );

  return (
    <ItemListSidebar
      canProceed={canUpload}
      importLabel={t('parameterListSidebar.import')}
      proceedLabel={t('parameterListSidebar.nextStep')}
      removeAllLabel={t('parameterListSidebar.removeAllItems')}
      items={manifest}
      renderItem={renderItem}
      title={t('parameterListSidebar.title')}
      onImportItems={onImportItems}
      onRemoveAllItems={onRemoveAllItems}
      onRemoveItem={onRemoveItem}
      onStart={onStart}
    />
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canUpload: !isManifestEmpty(state),
    manifest: getParameterManifest(state),
  }),
  // mapDispatchToProps
  {
    onImportItems: importParametersFromFile,
    onRemoveAllItems: clearManifest,
    onRemoveItem: removeParameterFromManifest,
    onStart: proceedToUpload,
  }
)(ParameterListSidebar);
