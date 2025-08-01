import HelpIcon from '@mui/icons-material/Help';
import type { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

const useStyles = makeStyles((theme: Theme) => ({
  iconContainer: {
    padding: theme.spacing(1),
  },
}));

type Props = {
  content: React.ReactNode;
};

function DialogHelpIcon(props: Props) {
  const { content } = props;
  const styles = useStyles();
  return (
    <div className={styles.iconContainer}>
      <Tooltip content={content}>
        <HelpIcon />
      </Tooltip>
    </div>
  );
}

export default DialogHelpIcon;
