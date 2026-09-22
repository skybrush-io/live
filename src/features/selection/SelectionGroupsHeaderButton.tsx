import Workspaces from '@mui/icons-material/Workspaces';
import { useSelector } from 'react-redux';

import { GenericHeaderButton, LazyTooltip } from '@skybrush/mui-components';

import PinnableTooltipContents from '~/components/header/PinnableTooltipContents';

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
    <LazyTooltip
      interactive
      content={
        <PinnableTooltipContents component='selection-group-mini-list'>
          <SelectionGroupMiniList />
        </PinnableTooltipContents>
      }
    >
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
