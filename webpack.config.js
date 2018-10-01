const path = require('path');
const packagejson = require('./package.json');

const dashLibraryName = packagejson.name.replace(/-/g, '_');

module.exports = {
  entry: {main: './src/lib/index.js'},
  output: {
    path: path.resolve(__dirname, dashLibraryName),
    filename: 'bundle.js',
    library: dashLibraryName,
    libraryTarget: 'window',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'plotly.js': 'Plotly',
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve('./src/lib/resources/yfiles/es6-modules')
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /resources\\yfiles/],
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
    ],
  },
};
