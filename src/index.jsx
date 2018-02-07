import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

import React from 'react'
import { render } from 'react-dom'

import Application from './app'
import { loadStoreFromStorageBackend } from './store'
import workbench from './workbench'

// const __PROD__ = process.env.NODE_ENV === 'production'
// const __DEV__ = !__PROD__

function initialize () {
  TimeAgo.locale(en)

  return loadStoreFromStorageBackend().then(state => {
    if (state && state.workbench && state.workbench.state) {
      workbench.restoreState(state.workbench.state)
    }
  })
}

function renderApplication () {
  const root = document.getElementById('root')
  return render(<Application />, root)
}

initialize().then(renderApplication)
