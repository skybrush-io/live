import { useContext } from 'react';
import { FlockContext } from '~/flock';
import type Flock from '~/model/flock';

/**
 * Hook that attaches to the main message hub of the application and returns
 * a reference to it.
 */
const useFlock = (): Flock => useContext(FlockContext);

export default useFlock;
