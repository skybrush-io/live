import Workspaces from '@mui/icons-material/Workspaces';

import { GenericHeaderButton, LazyTooltip } from '@skybrush/mui-components';

import SelectionGroupMiniList from './SelectionGroupMiniList';

const SelectionGroupMenuButton = () => {
  return (
    <LazyTooltip interactive content={<SelectionGroupMiniList />}>
      <GenericHeaderButton>
        <Workspaces />
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

export default SelectionGroupMenuButton;
