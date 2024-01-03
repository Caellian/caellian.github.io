<svelte:head>
  <meta name="description" content="Tin Švagelj's web blog." />
  <title>tinsvagelj::net - blog</title>
</svelte:head>

<div id="blog-layout">
  <slot />
</div>

<style lang="stylus">
@media (min-width: 770px)
  #blog-layout
    width @css { clamp(30ch, 90vw, 80ch) }
    margin 1rem auto

#blog-layout:has(.post-list)
  display flex
  gap 0.5rem
  --side-width 30ch

  :global(.post-list)
    flex-grow 1

  :global(aside.blog-sidebar)
    right 1rem
    width var(--side-width)
    margin-top 4rem

    :global(a)
      display flex
      align-items center

@media (max-width: 770px)
  #blog-layout
    flex-direction column

    :global(.island)
      border-radius 0
      border-left none
      border-right none
    
    :global(aside.blog-sidebar)
      width initial !important
      margin-top 0.5rem !important
</style>
