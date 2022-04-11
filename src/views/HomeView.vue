<template>
  <div>
    <h1 class="title">Vue.js 2 Starter by frōntensō</h1>
    <Picture src="/cat.jpg" alt="" />
  </div>
</template>

<script>
import Picture from "@/components/Picture";

export default {
  name: "HomeView",
  components: {
    Picture,
  },
};
</script>

<style scoped lang="scss">
.title {
  font-size: 32px;
}
</style>
