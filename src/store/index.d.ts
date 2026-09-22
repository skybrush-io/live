import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import type { SagaMiddleware } from 'redux-saga';

import type { AppDispatch, RootState } from './reducers';

declare const store: Store<RootState> & { dispatch: AppDispatch };
export default store;

export const sagaMiddleware: SagaMiddleware;
export const persistor: Persistor;
export function clearStore(): Promise<void>;
export function clearStoreAfterConfirmation(): Promise<void>;
export function waitUntilStateRestored(): Promise<void>;
