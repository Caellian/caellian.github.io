<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { RGB } from "$lib/color";

  import NavBar from "$components/NavBar.svelte";
  import { Mode, Theme } from "$lib/theme";

  var navigate = $page.url.pathname === "/navigation";

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const theme = new Theme(RGB.parse("#00a4ba")!, Mode.Dark);
</script>

<svelte:head>
  <title>tinsvagelj::net</title>
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
