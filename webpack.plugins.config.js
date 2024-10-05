const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    text: './src/plugins/TextPlugin.js',
    // Remove the code entry for now
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
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'markdown-it': 'markdownit',
  },
};