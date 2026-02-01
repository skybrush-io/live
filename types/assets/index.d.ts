// As per `webpack/base.config.js`, imports with certain extensions are
// resolved to their paths through the "Asset Modules" feature of webpack.

declare module '*.png' {
  const path: string;
  export default path;
}

declare module '*.skyc' {
  const path: string;
  export default path;
}

declare module '*.svg' {
  const path: string;
  export default path;
}
