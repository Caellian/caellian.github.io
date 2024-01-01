<script>
  import { browser } from "$app/environment";
  import { page } from "$app/stores";

  import NavBar from "$components/NavBar.svelte";
  import { onMount } from "svelte";

  var navigate = $page.url.pathname === "/navigation";

  var root;

  onMount(() => {
    root = document.querySelector("body");

    root.setAttribute(
      "data-scheme",
      localStorage.getItem("scheme-preference") ||
        (window.matchMedia("(prefers-color-scheme: light)") && "light") ||
        "dark"
    );
  });
</script>

<svelte:head>
  <title>tinsvagelj::net</title>
</svelte:head>

<NavBar />

<div class="layout-root" style="opacity:{navigate ? '0' : '1'}">
  <slot />
</div>

<style global lang="stylus">
  @import "../style/scheme";
  @import "../style/global";
</style>
