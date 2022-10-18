<script lang="ts">
  import { parse } from "$lib/color";

  interface Icon {
    dim: number;
    content: string;
  }

  import icon_list from "$lib/icons.json";
  const icons: { [key: string]: Icon } = icon_list;

  export let name: string;
  export let size: string = "1rem";
  export let width: string = size || "1rem";
  export let height: string = size || "1rem";
  export let color: string = "var(--icon-color, #fff)";

  let icon = icons[name] || null;
</script>

{#if icon != null}
  <svg
    on:click
    style="--color:{color}"
    class="{$$props.class || `icon-${name}`} icon"
    width={width || "1rem"}
    height={height || "1rem"}
    fill={color}
    viewBox="0 0 {icon?.dim} {icon?.dim}">{@html icon?.content}</svg
  >
{/if}
