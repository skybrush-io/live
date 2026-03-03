import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import type { RootState } from '~/store/reducers';

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    color: 'white',
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
  },
}));

type Props = {
  channel: number;
};

const ChannelIndicator = ({ channel }: Props) => {
  const classes = useStyles();
  return <div className={classes.root}>{channel}</div>;
};

export default connect((state: RootState) => ({
  channel: getPreferredCommunicationChannelIndex(state) + 1,
}))(ChannelIndicator);
