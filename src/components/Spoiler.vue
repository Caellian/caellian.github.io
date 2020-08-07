<template>
  <details>
    <summary>{{ name }}</summary>
    <slot></slot>
  </details>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Spoiler extends Vue {}
</script>

<style scoped lang="scss"></style>
