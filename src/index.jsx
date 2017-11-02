import React from 'react'
import { render } from 'react-dom'

import Application from './app'
import store, { loadStoreFromStorageBackend } from './store'
import workbench from './workbench'

const __PROD__ = process.env.NODE_ENV === 'production'
const __DEV__ = !__PROD__

function initialize () {
  return loadStoreFromStorageBackend().then(() => {
    const state = store.getState()
    if (state && state.workbench && state.workbench.state) {
      workbench.restoreState(state.workbench.state)
    }
  })
}

function renderApplication () {
  const root = document.getElementById('root')

  if (__DEV__) {
    const RedBox = require('redbox-react').default
    try {
      render(<Application />, root)
    } catch (e) {
      // You need https://github.com/WizardOfOgz/atom-handler on OS X to make
      // the atm:// URL scheme work with Atom. I have no idea about Windows.
      render(<RedBox error={e} editorScheme={'atm'} />, root)
    }
  } else {
    render(<Application />, root)
  }
}

initialize().then(renderApplication)
