module.exports = {
  entry: './src/app.tsx',
  output: {
    filename: './dist/bundle.js'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' },
	  { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192' },
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
}