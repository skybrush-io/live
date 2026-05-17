import Workspaces from '@mui/icons-material/Workspaces';
import { useSelector } from 'react-redux';

import { GenericHeaderButton, LazyTooltip } from '@skybrush/mui-components';

import SelectionGroupMiniList from './SelectionGroupMiniList';
import { getNumberOfSelectedItems } from './selectors';

const buttonStyle: React.CSSProperties = {
  justifyContent: 'space-between',
  textAlign: 'right',
  minWidth: 64,
};

const SelectionGroupMenuButton = () => {
  const numberOfSelectedItems = useSelector(getNumberOfSelectedItems);

  return (
    <LazyTooltip interactive content={<SelectionGroupMiniList />}>
      <GenericHeaderButton
        label={numberOfSelectedItems > 0 ? String(numberOfSelectedItems) : '—'}
        style={buttonStyle}
      >
        <Workspaces />
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

export default SelectionGroupMenuButton;
