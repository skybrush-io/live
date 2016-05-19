module.exports = {
  devtool: 'eval',
  entry: './src/index.jsx',
  output: {
    filename: './dist/bundle.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192' }
    ],
    noParse: /dist\/ol.js/
  }
}
