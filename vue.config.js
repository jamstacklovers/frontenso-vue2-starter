const { defineConfig } = require("@vue/cli-service");
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
});
