import List from '@material-ui/core/List';
import { styled } from '@material-ui/core/styles';

/**
 * Styled list component where the background color is set to transparent so
 * the parent component could decide what the background color should be.
 */
export default styled(List)({
  background: 'unset',
});
