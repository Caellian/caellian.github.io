<script>
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";

  export let content;

  function copyContent() {
    navigator.clipboard.writeText(content);
  }
</script>

<button class="copy" on:click={copyContent}>
  <Icon name={"copy"} />
  <span>Copy</span>
</button>

<style lang="stylus">
button.copy
  display flex
  gap 0.2rem
  align-items center
  border-radius: 0.2rem
  padding: 0.2rem 0.5rem

  :global(svg)
    width 1.5em
    height 1.5em
</style>
