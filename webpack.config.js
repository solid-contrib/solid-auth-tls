const path = require('path')

const webpack = require('webpack')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'solid-auth-tls.min.js',
    library: 'SolidAuthTLS',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({ 'global.IS_BROWSER': true }),
    new webpack.optimize.UglifyJsPlugin()
  ]
}
