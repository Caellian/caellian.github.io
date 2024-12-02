<script>
  import { browser } from "$app/environment";

  /**
   * @typedef {object} Icon
   * @prop {number} dim
   * @prop {string} content
   */

  export let name;
  
  /** @type {Promise<Icon>} */
  $: iconPromise = (async (name) => {
    let all = await fetch("/data/icons.json");
    all = await all.json();
    return all[name] || null
  })(name);

  export let size = "var(--icon-size, 1em)";
  export let stroke = "var(--icon-color, var(--fg))";
  export let fill = "var(--icon-color, var(--fg))";
</script>

{#await iconPromise}

{:then icon}
  {#if icon != null && browser}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <svg
      on:mouseup
      style="--icon-stroke:{stroke};--icon-fill:{fill};--icon-size:{size};"
      class="{$$props.class || `icon-${name}`} icon"
      viewBox="-2 -2 {icon.dim + 2} {icon.dim + 2}"
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      {@html icon.content}
    </svg>
  {/if}
{/await}

<style lang="stylus">
.icon
  width: var(--icon-size, 1em)
  height: var(--icon-size, 1em)
  padding 0.15rem
</style>
