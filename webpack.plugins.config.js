const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    text: './plugin-src/TextPlugin.js',
    code: './plugin-src/CodePlugin.js',
  },
  output: {
    filename: '[name]Plugin.js',
    path: path.resolve(__dirname, 'public', 'static', 'js'),
    library: {
      name: '[name]Plugin',
      type: 'window',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
  },
};