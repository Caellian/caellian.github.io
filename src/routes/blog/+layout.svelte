<svelte:head>
  <meta name="description" content="Tin Švagelj's web blog." />
  <title>tinsvagelj::net - blog</title>
</svelte:head>

<div id="blog-layout">
  <slot />
</div>

<style lang="stylus">
#blog-layout
  width: @css { clamp(30ch, 90vw, 80ch) }
  margin: 1rem auto

:global(aside.blog-sidebar)
  margin-top 1rem
  :global(a)
    display flex
    align-items center
</style>
