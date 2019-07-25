// this is only here because this is webpack's default file name, but we really want to use the dev config here
var config;
if (process.env.NODE_ENV == "development") {
  config = require("./webpack.dev.config.js");
} else {
  config = require("./webpack.prod.config.js");
}
module.exports = config;
