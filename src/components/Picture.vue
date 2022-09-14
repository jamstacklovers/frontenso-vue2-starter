<template>
  <img v-if="isSvg" :src="importedImagePath" :alt="alt" />
  <picture v-else>
    <source v-if="shouldShowOptimizedSources" :srcset="srcAvif" type="image/avif" />
    <source v-if="shouldShowOptimizedSources" :srcset="srcWebp" type="image/webp" />
    <img
      :src="importedImagePath"
      :class="className"
      v-bind="$attrs"
      :loading="loading"
      :alt="alt"
    />
  </picture>
</template>

<script>
export default {
  name: "Picture",
  inheritAttrs: false,
  props: {
    className: {
      default: "",
      type: String,
      required: false,
    },
    src: {
      default: "",
      type: String,
      required: true,
    },
    alt: {
      default: "",
      type: String,
      required: true,
    },
    loading: {
      type: String,
      default: "lazy",
      required: false,
    },
  },
  computed: {
    shouldShowOptimizedSources() {
      return process.env.NODE_ENV === "production";
    },
    isSvg() {
      return this.src?.split(".").slice(-1)[0] === "svg";
    },
    importedImagePathWithoutExtension() {
      return this.getPathWithoutExtension(this.importedImagePath);
    },
    srcAvif() {
      return `${this.importedImagePathWithoutExtension}.avif${this.queryParams}`;
    },
    srcWebp() {
      return `${this.importedImagePathWithoutExtension}.webp${this.queryParams}`;
    },
    importedImagePath() {
      return require(`@/assets/images${this.src}`);
    },
    queryParams() {
      return this.getQueryParams(this.importedImagePath);
    },
  },
  methods: {
    getPathWithoutExtension(path) {
      return path.split(".").slice(0, -1).join(".");
    },

    getQueryParams(path) {
      const end = path.split(".").slice(-1)[0];
      const params = end.split("?")[1];
      return params ? `?${params}` : "";
    },
  },
};
</script>
