<template>
  <nav ref="navigation" id="navigation">
    <h1 class="name">caellian::net</h1>
    <div ref="hamburger" class="hamburger" v-on:click="setNavOpen()">
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
    </div>
    <div ref="navLinks" class="links" v-on:click="setNavOpen()">
      <router-link to="/about">About Me</router-link>
      <router-link to="/projects">Projects</router-link>
      <a href="https://github.com/Caellian">GitHub</a>
      <router-link to="/contact">Contact</router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Navigation extends Vue {
  created() {
    window.addEventListener('scroll', this.onScroll);
  }

  destroyed() {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll() {
    this.setNavOpen(false);
  }

  setNavOpen(state?: boolean) {
    if (state == null) {
      (this.$refs.navigation as HTMLElement).classList.toggle('fixed');
      (this.$refs.hamburger as HTMLElement).classList.toggle('open');
      (this.$refs.navLinks as HTMLElement).classList.toggle('shown');
    } else if (state) {
      (this.$refs.navigation as HTMLElement).classList.add('fixed');
      (this.$refs.hamburger as HTMLElement).classList.add('open');
      (this.$refs.navLinks as HTMLElement).classList.add('shown');
    } else {
      (this.$refs.navigation as HTMLElement).classList.remove('fixed');
      (this.$refs.hamburger as HTMLElement).classList.remove('open');
      (this.$refs.navLinks as HTMLElement).classList.remove('shown');
    }
  }
};
</script>

<style scoped lang="scss">
@import "./sass/nav";
</style>
