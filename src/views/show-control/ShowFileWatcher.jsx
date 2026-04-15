import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FileWatcher from '~/components/FileWatcher';
import { getAbsolutePathOfShowFile } from '~/features/show/selectors';
import { notifyShowFileChangedSinceLoaded } from '~/features/show/slice';

/**
 * React component that reports if the loaded show file has been modified.
 */
const ShowFileWatcher = ({ filename, onShowFileChangedExternally }) => (
  <FileWatcher filename={filename} onChanged={onShowFileChangedExternally} />
);

ShowFileWatcher.propTypes = {
  filename: PropTypes.string,
  onShowFileChangedExternally: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    filename: getAbsolutePathOfShowFile(state),
  }),
  // mapDispatchToProps
  {
    onShowFileChangedExternally: notifyShowFileChangedSinceLoaded,
  }
)(ShowFileWatcher);
