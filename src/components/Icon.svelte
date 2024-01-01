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
  export let size = "1em";
  export let width = toPX(size || "1em");
  export let height = toPX(size || "1em");
  export let color = "var(--icon-color, #fff)";

  const icon = icons[name] || null;
</script>

{#if icon != null && browser}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg
    on:mouseup
    style="--color:{color};fill:var(--color);"
    class="{$$props.class || `icon-${name}`} icon"
    {width}
    {height}
    viewBox="-2 -2 {icon.dim + 2} {icon.dim + 2}"
    role="img"
  >
    {@html icon?.content}
  </svg>
{/if}

<style lang="stylus">
.icon
  padding 0.15rem
</style>
