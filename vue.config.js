const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: "/",
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "~@/sass/styles.scss";`,
      },
    },
  },
  configureWebpack: {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
    ],
  },
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        options.hotReload = !process.env.DISABLE_HOT_RELOAD;
        return options;
      });
  },
});
