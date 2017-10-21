/**
 * @file Utility file providing a better interface for logging related actions.
 */

import store from '../store'
import { addLogItem } from '../actions/log'

export const addInfoItem = (content) => {
  store.dispatch(addLogItem({ level: 0, content }))
}

export const addWarningItem = (content) => {
  store.dispatch(addLogItem({ level: 1, content }))
}

export const addErrorItem = (content) => {
  store.dispatch(addLogItem({ level: 2, content }))
}
