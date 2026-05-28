/**
 * @file Component for displaying logged messages.
 */

import { connect } from 'react-redux';
import { useEffectOnce } from 'react-use';

import { updateLogPanelVisibility } from '~/features/log/slice';
import type { LogItem } from '~/features/log/types';
import type { RootState } from '~/store/reducers';

import LogMessageList from './LogMessageList';

type LogPanelProps = {
  items: LogItem[];
  updateLogPanelVisibility: (visible: boolean) => void;
};

const LogPanel = ({ items, updateLogPanelVisibility }: LogPanelProps) => {
  useEffectOnce(() => {
    updateLogPanelVisibility(true);
    return () => updateLogPanelVisibility(false);
  });

  return <LogMessageList items={items} />;
};

export default connect<
  { items: LogItem[] },
  { updateLogPanelVisibility: typeof updateLogPanelVisibility },
  unknown,
  RootState
>(
  // mapStateToProps
  (state: RootState) => ({
    items: state.log.items,
  }),
  // mapDispatchToProps
  { updateLogPanelVisibility }
)(LogPanel);
