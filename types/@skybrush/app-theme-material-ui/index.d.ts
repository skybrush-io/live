/*
 * @file Temporarily borrow typings from `app-theme-mui` while Live still
 *       depends on Material UI v4.
 */

declare module '@skybrush/app-theme-material-ui' {
  export {
    colorForStatus,
    Colors,
  } from '@skybrush/app-theme-material-ui/colors';

  export {
    defaultFont,
    monospacedFont,
  } from '@skybrush/app-theme-material-ui/fonts';

  // Should be `./semantics`, but import or export declaration in an ambient
  // module declaration cannot reference module through relative module name...
  export { Status } from '@skybrush/app-theme-material-ui/semantics';

  export { isThemeDark } from '@skybrush/app-theme-material-ui/theme';
}
