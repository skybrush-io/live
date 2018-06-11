// Decide whether we will connect to the Webpack dev server in development
// mode or not
exports.willUseWebpack = (
  process.env.NODE_ENV !== 'production' &&
  process.env.DEPLOYMENT !== '1'
)
