import { withProps } from 'recompose'

import { Badge } from '../Badge'

/**
 * Special variant of badges shown on the sidebar.
 */
export default withProps({
  offset: [8, 8]
})(Badge)
