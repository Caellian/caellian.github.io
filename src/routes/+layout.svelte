<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { RGB } from "$lib/color";

  import NavBar from "$components/NavBar.svelte";
  import { Mode, Theme } from "$lib/theme";

  var navigate = $page.url.pathname === "/navigation";

  let theme = new Theme(RGB.parse("#00b3b3"), Mode.Dark);
</script>

<svelte:head>
  <title>caellian::me</title>
</svelte:head>

<NavBar />

<div class="layout-root" style="opacity:{navigate ? '0' : '1'}">
  <slot />
</div>

{#if browser}
  {@html theme.styleTag()}
{/if}

<style global lang="stylus">
  @import "../style/global";
</style>
