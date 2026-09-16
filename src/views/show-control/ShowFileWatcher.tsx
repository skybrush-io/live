import { connect } from 'react-redux';

import FileWatcher from '~/components/FileWatcher';
import { getAbsolutePathOfShowFile } from '~/features/show/selectors';
import { notifyShowFileChangedSinceLoaded } from '~/features/show/slice';
import type { RootState } from '~/store/reducers';

type Props = {
  filename?: string | null;
  onShowFileChangedExternally: () => void;
};

/**
 * React component that reports if the loaded show file has been modified.
 */
const ShowFileWatcher = ({ filename, onShowFileChangedExternally }: Props) => (
  <FileWatcher filename={filename} onChanged={onShowFileChangedExternally} />
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    filename: getAbsolutePathOfShowFile(state),
  }),
  // mapDispatchToProps
  {
    onShowFileChangedExternally: notifyShowFileChangedSinceLoaded,
  }
)(ShowFileWatcher);
