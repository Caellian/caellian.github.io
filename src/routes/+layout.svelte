<script lang="ts">
  import { page } from "$app/stores";
  import { RGB } from "$lib/color";

  import NavBar from "$lib/components/NavBar.svelte";
  import { Mode, Theme } from "$lib/theme";

  var navigate = $page.url.pathname === "/navigation";

  let theme = new Theme(RGB.parse("#ff7b00"), Mode.Dark);
</script>

<svelte:head>
  <title>caellian::me</title>
</svelte:head>

<NavBar />

<div class="layout-root" style="opacity:{navigate ? '0' : '1'};{theme.cssVars()}">
  <slot />
</div>

{@html theme.styleTag()}

<style global lang="stylus">
@import '../style/global'
</style>
