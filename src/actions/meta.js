/**
 * @file Action metadata creators.
 */

/**
 * Creates an action metadata object that lets the Redux middlewares know
 * that the action should be debounced with the given debouncing type.
 *
 * Debouncing types are defined in `store.js` when we set up the debouncing
 * middleware.
 *
 * @param  {string} type  the debouncing type; typically `simple` is okay
 *         if you don't need any special treatment
 * @return {Object} the action metadata
 */
export const debounced = (type = 'simple') => () => ({ debounce: type })
