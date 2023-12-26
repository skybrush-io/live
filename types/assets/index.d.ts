// As per `webpack/base.config.js`, imports with certain extensions are
// resolved to their paths through the "Asset Modules" feature of webpack.

declare module '*.skyc' {
  const path: string;
  export default path;
}
