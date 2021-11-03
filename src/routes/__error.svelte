<script lang="ts" context="module">
  import FourOhFour from "./404.svelte";

  export function load({ error, status }) {
    return {
      props: {
        status,
        error,
      },
    };
  }
</script>

<script lang="ts">
  export let status: number;
  export let error: Error;

  function copyError() {
    navigator.clipboard.writeText(JSON.stringify(error));
  }
</script>

{#if status == 404}
  <FourOhFour />
{:else}
  <div class="center">
    <div>
      <h1>Sorry, the website errored. 😅</h1>
      <h2>Error status: {status}</h2>
      <p>{error.message}</p>
      <p>
        This shouldn't happen.<br />
        It would be super sweet of you if you reported the error on my website's
        <a href="https://github.com/Caellian/caellian.github.io/issues"
          >GitHub Issues</a
        > page.
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
			text-align center

    p
			margin-left auto
			margin-right auto

		button
			margin-top 2vh
			margin-left auto
			margin-right auto
</style>
