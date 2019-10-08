/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of saved locations. The location list includes the
 * current location that can be saved and any other Location
 * that the user has saved earlier.
 */

import { handleActions } from 'redux-actions';

import {
  addToFront,
  createNewItemAtFrontOf,
  deleteById,
  update
} from '~/utils/collections';

/**
 * Default content of the saved location registry in the state object.
 */
const defaultState = {
  byId: {
    elte: {
      id: 'elte',
      name: 'ELTE Kert',
      center: {
        lon: 19.061951,
        lat: 47.47334
      },
      rotation: 0,
      zoom: 17
    },
    fahegy: {
      id: 'fahegy',
      name: 'Farkashegyi Repülőtér',
      center: {
        lon: 18.915125,
        lat: 47.486305
      },
      rotation: 59,
      zoom: 17
    },
    fina: {
      id: 'fina',
      name: 'FINA Launch',
      center: {
        lon: 19.048888,
        lat: 47.494545
      },
      rotation: 338,
      zoom: 19
    }
  },

  order: ['elte', 'fahegy', 'fina']
};

/**
 * The reducer function that handles actions related to the handling of
 * saved location states.
 */
const reducer = handleActions(
  {
    ADD_SAVED_LOCATION: (state, action) => {
      const location = { ...action.payload.savedLocation };
      return addToFront(location, state);
    },

    CREATE_NEW_SAVED_LOCATION: (state, action) => {
      return createNewItemAtFrontOf(state, action);
    },

    DELETE_SAVED_LOCATION: (state, action) => {
      const currentLocationId = action.payload.savedLocationId;
      return deleteById(currentLocationId, state);
    },

    UPDATE_SAVED_LOCATION: (state, action) =>
      update(action.payload.savedLocation, state)
  },
  defaultState
);

export default reducer;
