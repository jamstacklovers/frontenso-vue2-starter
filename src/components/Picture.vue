<template>
  <picture>
    <source :srcset="srcAvif" type="image/avif" />
    <source :srcset="srcWebp" type="image/webp" />
    <img :src="`${srcOriginal}`" :class="className" v-bind="$attrs" />
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
  },
  computed: {
    srcWithoutExtension() {
      return this.src?.split(".")[0];
    },
    srcAvif() {
      return require(`@/assets/images${this.srcWithoutExtension}.avif`);
    },
    srcWebp() {
      return require(`@/assets/images${this.srcWithoutExtension}.webp`);
    },
    srcOriginal() {
      return require(`@/assets/images${this.src}`);
    },
  },
};
</script>
