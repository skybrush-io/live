// Returns whether we are in production mode
exports.isProduction =
  process.env.NODE_ENV === 'production' || process.env.DEPLOYMENT === '1';

// Decide whether we will connect to the Webpack dev server in development
// mode or not
exports.willUseWebpackDevServer =
  process.env.NODE_ENV !== 'production' && process.env.DEPLOYMENT !== '1';
