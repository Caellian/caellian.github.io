<template>
  <footer ref="footer">
    <p class="copyright">
      Copyright &copy; 2020 Tin Švagelj.
      <br />All Rights Reserved.
    </p>
    <div class="share" v-on:click="setShareOpen(null)">
      <font-awesome-icon :icon="['fas', 'share-alt']" />
    </div>
    <div class="social">
      <p>Share on:</p>
      <a
        href="https://www.facebook.com/sharer.php?u=https%3A%2F%2Fcaellian.net"
      >
        <font-awesome-icon :icon="['fab', 'facebook']" />
      </a>
      <a
        href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fcaellian.net&text=Check%20out%20Caellian%27s%20web%20portfolio%21&hashtags=caellian,programming"
      >
        <font-awesome-icon :icon="['fab', 'twitter']" />
      </a>
      <a
        href="whatsapp://send?text=Check out Caellian's web portfolio at: https://caellian.net"
      >
        <font-awesome-icon :icon="['fab', 'whatsapp']" />
      </a>
      <a
        href="https://t.me/share/url?url=https%3A%2F%2Fcaellian.net&text=Check%20out%20Caellian%27s%20web%20portfolio%21"
      >
        <font-awesome-icon :icon="['fab', 'telegram-plane']" />
      </a>
    </div>
  </footer>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Footer extends Vue {
  sharedOpen = true;

  created() {
    window.addEventListener("scroll", this.onScroll);
  }

  destroyed() {
    window.removeEventListener("scroll", this.onScroll);
  }

  onScroll() {
    this.setShareOpen(false);
  }

  setShareOpen(state?: boolean) {
    if (state == null) {
      (this.$refs.footer as HTMLElement).classList.toggle("show-share");
    } else if (state) {
      (this.$refs.footer as HTMLElement).classList.add("show-share");
    } else {
      (this.$refs.footer as HTMLElement).classList.remove("show-share");
    }
  }
}
</script>

<style scoped lang="scss">
@import "./sass/foot";
</style>
