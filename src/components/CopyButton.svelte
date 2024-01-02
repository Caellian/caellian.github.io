<script>
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";

  export let content;

  function copyContent() {
    navigator.clipboard.writeText(content);
  }
</script>

<button class="copy" on:click={copyContent}>
  <Icon size="1.5rem" name={"copy"} />
  <span>Copy</span>
</button>

<style lang="stylus">
button.copy
  display flex
  gap 0.2rem
  align-items center
  border-radius: 0.2rem
  padding: 0.2rem
  padding-right 0.5rem
</style>
