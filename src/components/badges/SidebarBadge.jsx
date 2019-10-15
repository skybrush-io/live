import Badge from 'react-badger';
import withProps from 'recompose/withProps';

/**
 * Special variant of badges shown on the sidebar.
 */
export default withProps({
  offset: [8, 8]
})(Badge);
