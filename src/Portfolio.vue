<template>
  <div id="portfolio">
    <Navigation pages='{{}}'/>
    <div id="content-view">
      <router-view></router-view>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Navigation from "@/components/Navigation.vue";
import Footer from "@/components/Footer.vue";

@Component({
  components: {
    Navigation,
    Footer
  }
})
export default class Portfolio extends Vue {
  name = "portfolio";
}
</script>

<style lang="scss">
@import "./sass/base";

#portfolio {
  min-height:100%;
  position: relative;
}

#content-view {
  height: 100%;

  padding-bottom: 2.5rem;
}
</style>
