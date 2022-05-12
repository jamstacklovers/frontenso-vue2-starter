<template>
  <Picture class="background-picture" alt="" :src="src" :style="cssVars" :loading="loading" />
</template>

<script>
import Picture from "@/components/Picture";

export default {
  name: "BackgroundPicture",
  components: {
    Picture,
  },
  props: {
    src: {
      default: "",
      type: String,
      required: true,
    },
    zIndex: {
      type: String,
      default: "-1",
    },
    loading: {
      type: String,
      default: "lazy",
      required: false,
    },
  },
  computed: {
    cssVars() {
      return {
        "--z-index": this.zIndex,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.background-picture {
  position: absolute;
  z-index: var(--z-index);
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;

  &::v-deep img {
    position: absolute;
    bottom: 0;
    object-fit: cover;
    min-height: 100%;
    min-width: 100%;
  }
}
</style>
