import SelectAll from '@mui/icons-material/SelectAll';
import Divider from '@mui/material/Divider';
import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Tooltip } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import SelectionGroupMenuItem from './SelectionGroupMenuItem';
import { getOrderedSelectionGroups } from './selectors';
import { saveCurrentSelectionAsGroup } from './slice';
import type { SelectionGroup } from './types';

type StateProps = {
  selectionGroups: SelectionGroup[];
};

type DispatchProps = {
  saveCurrentSelectionAsGroup: (group?: string) => void;
};

type Props = StateProps &
  DispatchProps & {
    size?: IconButtonProps['size'];
  };

const useMenuState = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>(undefined);
  const isOpen = anchorEl !== undefined;
  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(undefined);
  };

  return { anchorEl, isOpen, handleButtonClick, handleClose };
};

const SelectionGroupMenuButton = ({
  saveCurrentSelectionAsGroup,
  selectionGroups,
  size,
}: Props) => {
  const { anchorEl, handleButtonClick, handleClose, isOpen } = useMenuState();
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroupMenuButton',
  });
  const saveSelection = useCallback(() => {
    saveCurrentSelectionAsGroup();
    handleClose();
  }, [handleClose, saveCurrentSelectionAsGroup]);

  return (
    <Tooltip content={t('tooltip')}>
      <>
        <IconButton size={size} onClick={handleButtonClick}>
          <SelectAll />
        </IconButton>
        <Menu anchorEl={anchorEl} open={isOpen} onClose={handleClose}>
          <MenuItem onClick={saveSelection}>{t('action.save')}</MenuItem>
          {selectionGroups.length > 0 && (
            <>
              <Divider />
              <MenuItem disabled>
                <Typography>{t('header.groups')}</Typography>
              </MenuItem>
              {selectionGroups.map((g) => (
                <SelectionGroupMenuItem
                  key={g.name}
                  group={g}
                  onClick={() => {
                    handleClose();
                  }}
                />
              ))}
            </>
          )}
        </Menu>
      </>
    </Tooltip>
  );
};

const ConnectedSelectionGroupMenuButton = connect(
  // mapStateToProps
  (state: RootState) => ({
    selectionGroups: getOrderedSelectionGroups(state),
  }),
  // mapDispatchToProps
  {
    saveCurrentSelectionAsGroup,
  }
)(SelectionGroupMenuButton);

export default ConnectedSelectionGroupMenuButton;
