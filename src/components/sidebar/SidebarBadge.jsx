import { Badge } from 'react-flexible-workbench'
import { withProps } from 'recompose'

/**
 * Special variant of badges shown on the sidebar.
 */
export default withProps({
  offset: [8, 8]
})(Badge)
