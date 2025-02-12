var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: path.resolve(__dirname, "./app/index.js"),
  output: {
    path: path.resolve(__dirname, "./public/assets"),
    filename: "app.js",
    sourceMapFilename: "smaps/[file].map"
  },
  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel",
        query: {
          cacheDirectory: true,
          presets: ["react", "es2015"]
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        // loader: 'style!css!sass'
        loader: ExtractTextPlugin.extract("style", "css", { publicPath: "/assets/" })
      },
      {
        test: /\.svg$/,
        loader: "file"
      },
      {
        test: /\.png$/,
        loader: "file"
      },
      {
        test: /\.(eot|woff|woff2|ttf)(\?\S*)?$/,
        loader: "url?limit=100000&name=[name].[ext]"
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'app.css'
    })
  ]
};
