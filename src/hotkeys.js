/**
 * @file File for storing hotkey configuration.
 */

export default [
  {
    keys: 'PlatMod + KeyA',
    action: () => { console.log('Select all') }
  },
  {
    keys: 'PlatMod + Shift + KeyA',
    action: () => { console.log('Deselect all') }
  }
]
