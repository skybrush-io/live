const path = require('path')

module.exports = {
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.css?$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, '..', 'config'),
          path.join(__dirname, '..', 'src')
        ]
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader',
        include: path.join(__dirname, '..', 'assets', 'css')
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192',
        include: path.join(__dirname, '..', 'assets')
      }
    ]
  }
}
