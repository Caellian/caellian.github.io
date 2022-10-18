<script lang="ts">
  export const prerender = true;

  import { prerendering } from "$app/environment";
  import { page } from "$app/stores";
  import { RGB } from "$lib/color";

  import Compass from "$lib/components/Compass.svelte";
  import NavBar from "$lib/components/NavBar.svelte";
  import NavLinks from "$lib/components/NavLinks.svelte";
  import { Mode, Theme } from "$lib/theme";
  import { onMount } from "svelte";

  var navigate = $page.url.pathname === "/navigation";

  let theme = new Theme(RGB.parse("#ff7b00"), Mode.Dark);
</script>

<svelte:head>
  <title>caellian::me</title>
</svelte:head>

<NavBar />

<div style="opacity:{navigate ? '0' : '1'};{theme.cssVars()}">
  <slot />
</div>

{@html theme.styleTag()}

<style global lang="stylus">
@import '../style/global'
main
  width 100vw
  min-height calc(100vh - var(--nav-height))
  overflow-x hidden
  transition opacity ease-in-out transition-medium
</style>
