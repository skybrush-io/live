import Workspaces from '@mui/icons-material/Workspaces';
import { useSelector } from 'react-redux';

import { GenericHeaderButton, LazyTooltip } from '@skybrush/mui-components';

import SelectionGroupMiniList from './SelectionGroupMiniList';
import { getNumberOfSelectedItems } from './selectors';

const SelectionGroupMenuButton = () => {
  const numberOfSelectedItems = useSelector(getNumberOfSelectedItems);

  return (
    <LazyTooltip interactive content={<SelectionGroupMiniList />}>
      <GenericHeaderButton
        label={numberOfSelectedItems > 0 ? String(numberOfSelectedItems) : '—'}
        style={{ fontSize: '1rem', fontWeight: 'normal', fontFamily: 'inherit' }}
      >
        <Workspaces />
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

export default SelectionGroupMenuButton;
