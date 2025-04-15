import { makeStyles } from '@material-ui/core/styles';
import HelpIcon from '@material-ui/icons/Help';
import React from 'react';

// @ts-ignore
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

const useStyles = makeStyles((theme) => ({
  iconContainer: {
    flexGrow: 1,
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
