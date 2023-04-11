<script lang="ts">
  import { browser } from "$app/environment";
  import toPX from "to-px";

  interface Icon {
    dim: number;
    content: string;
  }

  import icon_list from "$data/icons.json";
  const icons: { [key: string]: Icon } = icon_list;

  export let name: string;
  export let size = "1em";
  export let width = toPX(size || "1em");
  export let height = toPX(size || "1em");
  export let color = "var(--icon-color, #fff)";

  const icon = icons[name] || null;
</script>

{#if icon != null && browser}
  <svg
    on:mouseup
    style="--color:{color};fill:var(--color);"
    class="{$$props.class || `icon-${name}`} icon"
    {width}
    {height}
    viewBox="-2 -2 {icon?.dim + 2} {icon?.dim + 2}">{@html icon?.content}</svg
  >
{/if}

<style lang="stylus">
.icon
  padding 0.15rem
</style>
