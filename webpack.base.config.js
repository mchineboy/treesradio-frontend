var webpack = require("webpack");
var path = require("path");
var Config = require("webpack-config").default; // must be imported with .default in ES5 code: https://github.com/mdreizin/webpack-config/issues/29#issuecomment-236699084
var HtmlWebpackPlugin = require("html-webpack-plugin");
var VersionFile = require("webpack-version-file-plugin");
var short = require("git-rev-sync").short();
const {CleanWebpackPlugin} = require("clean-webpack-plugin");

module.exports = new Config().merge({
  entry: "./app/index.js",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        query: {
          plugins: ["lodash"]
        }
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.s[ac]ss$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        test: /\.css$/,
        loader: "css-loader"
      },
      {
        test: /\.less$/,
        loader: "less-loader"
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader",
        options: {
          limit: "250000",
          mimetype: "application/font-woff",
          name: "fonts/[hash].[ext]",
          esModule: false
        }
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader",
        options: {
          name: "fonts/[hash].[ext]",
          esModule: false
        }
      },
      {
        test: /\.(mp3|wav|ogg)$/,
        loader: "file-loader",
        options: {
          name: "audio/[hash].[ext]",
          esModule: false
        }
      },
      {
        test: /\.(jpg|png|gif|svg|svgz|cur)$/,
        loader: "file-loader",
        options: {
          name: "img/[name].[ext]",
          esModule: false
        }
      }
    ]
  },
  resolve: {
    alias: {
      app: path.join(__dirname, "app"),
      src: path.join(__dirname, "app"),
      stores: path.join(__dirname, "app/stores"),
      components: path.join(__dirname, "app/components"),
      utils: path.join(__dirname, "app/utils"),
      libs: path.join(__dirname, "app/libs"),
      modules: path.join(__dirname, "node_modules"),
      img: path.join(__dirname, "app/img"),
      audio: path.join(__dirname, "app/audio")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: require("html-webpack-template"),
      title: "TreesRadio",
      hash: true,
      favicon: "app/img/favicon.png",
      appMountId: "app"
    }),
    new VersionFile({
      packageFile: path.join(__dirname, "package.json"),
      outputFile: path.join(__dirname, "app/version.json"),
      templateString: `{"version": {"name": "<%= package.name %>", "buildDate": "<%= currentTime %>", "version": "<%= package.version %>", "short": "${short}"}}`
    })
  ]
});
