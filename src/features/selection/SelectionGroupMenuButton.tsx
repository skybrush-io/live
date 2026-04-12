import Workspaces from '@mui/icons-material/Workspaces';
import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tooltip } from '@skybrush/mui-components';

import SelectionGroupMenu from './SelectionGroupMenu';

type Props = Omit<IconButtonProps, 'onClick'>;

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

const SelectionGroupMenuButton = (props: Props) => {
  const { anchorEl, handleButtonClick, handleClose, isOpen } = useMenuState();
  const { t } = useTranslation(undefined, {
    keyPrefix: 'selectionGroups',
  });

  return (
    <Tooltip content={t('tooltip')}>
      <>
        <IconButton onClick={handleButtonClick} {...props}>
          <Workspaces />
        </IconButton>
        <SelectionGroupMenu
          anchorEl={anchorEl}
          open={isOpen}
          requestClose={handleClose}
        />
      </>
    </Tooltip>
  );
};

export default SelectionGroupMenuButton;
