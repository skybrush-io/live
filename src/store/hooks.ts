import { useDispatch } from 'react-redux';

import type { AppDispatch } from './reducers';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
