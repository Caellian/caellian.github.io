<script lang="ts">
  import { browser } from "$app/environment";

  interface Icon {
    dim: number;
    content: string;
  }

  import icon_list from "$data/icons.json";
  const icons: { [key: string]: Icon } = icon_list;

  export let name: string;
  export let size = "1rem";
  export let width = size || "1rem";
  export let height = size || "1rem";
  export let color = "var(--icon-color, #fff)";

  const icon = icons[name] || null;
</script>

{#if icon != null && browser}
  <svg
    on:mouseup
    style="--color:{color};fill:var(--color);"
    class="{$$props.class || `icon-${name}`} icon"
    width={width || "1rem"}
    height={height || "1rem"}
    viewBox="-2 -2 {icon?.dim + 2} {icon?.dim + 2}">{@html icon?.content}</svg
  >
{/if}

<style lang="stylus">
.icon
  padding 0.15rem
</style>
