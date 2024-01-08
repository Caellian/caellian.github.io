<script>
  import { browser } from "$app/environment";
  import toPX from "to-px";

  /**
   * @typedef {Object} Icon
   * @prop {number} dim
   * @prop {string} content
   */

  import icon_list from "$data/icons.json";
  /**
   * @type {{ [key: string]: Icon }}
   */
  const icons = icon_list;

  export let name;
  const icon = icons[name] || null;

  export let size = "var(--icon-size, 1em)";
  export let stroke = "var(--icon-color, var(--fg))";
  export let fill = "var(--icon-color, var(--fg))";
</script>

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

<style lang="stylus">
.icon
  width: var(--icon-size, 1em)
  height: var(--icon-size, 1em)
  padding 0.15rem
</style>
