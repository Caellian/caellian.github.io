<script>
  import { page } from "$app/stores";
  import FourOhFour from "./404/+page.svelte";

  function copyError() {
    navigator &&
      navigator.clipboard &&
      navigator.clipboard.writeText($page.error.message || "");
  }
</script>

{#if $page.status == 404}
  <FourOhFour />
{:else}
  <div class="center">
    <div>
      <h1>Sorry, the website errored. 😅</h1>
      <h2>Error status: {$page.status}</h2>
      {#if $page.error}
        <p>{$page.error.message}</p>
      {/if}
      <p>
        This shouldn't happen.<br />
        It would be super sweet of you if you reported the error on my website's
        <a href="https://github.com/Caellian/caellian.github.io/issues"
          >GitHub Issues</a
        > page. You don't have to though.
      </p>

      <button class="button" type="button" on:click|once={copyError}
        >Copy error for reporting</button
      >
    </div>
  </div>
{/if}

<style lang="stylus">
.center
  min-height calc(100vh - var(--nav-height))

h1,
h2
  text-align center !important

p
  margin-left auto
  margin-right auto

button
  margin-top 2vh
  margin-left auto
  margin-right auto
</style>
