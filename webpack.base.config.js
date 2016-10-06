var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var Config = require('webpack-config').default;

// console.log("WEBPACK_ENV", process.env);

const acceptedEnv = ["FBASE", "FBASE_API", "NODE_ENV", "API", "API_PROTOCOL"];

function cherrypickEnv(env) {
  var keys = Object.keys(env);
  keys = keys.filter(e => acceptedEnv.includes(e));
  var webpackEnv = {};
  keys.forEach(k => webpackEnv['process.env.'+k] = JSON.stringify(env[k]));
  // console.log("WEBPACK_ENV", webpackEnv, keys, env);
  return webpackEnv;
}


module.exports = new Config().merge({
  entry: path.resolve(__dirname, 'app/index.js'),
  output: {
    path: path.resolve(__dirname, 'public/assets'),
    filename: "[name].js"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      },
      {
        test: /\.scss$/,
        // loader: 'style!css!sass'
        loader: ExtractTextPlugin.extract("style", "css!sass", {publicPath: '/assets/'})
      },
      {
        test: /\.css$/,
        // loader: 'style!css!sass'
        loader: ExtractTextPlugin.extract("style", "css", {publicPath: '/assets/'})
      },
      {
        test: /\.png$/,
        loader: 'file'
      },
      {
        test: /\.jpg$/,
        loader: 'file'
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)(\?\S*)?$/,
        loader: 'url?limit=100000&name=[name].[ext]'
      }
    ]
  },
  resolve: {
    alias: {
      app: path.join(__dirname, 'app'),
      stores: path.join(__dirname, 'app/stores'),
      components: path.join(__dirname, 'app/components'),
      utils: path.join(__dirname, 'app/utils'),
      libs: path.join(__dirname, 'app/libs'),
      modules: path.join(__dirname, 'node_modules')
    }
  },
  plugins: [
    new ExtractTextPlugin("[name].css"),
    new webpack.DefinePlugin(cherrypickEnv(process.env))
  ]
})
