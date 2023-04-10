<div class="content-wrapper">
  <slot />
</div>

<footer>
  <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
    <img
      alt="Creative Commons License"
      src="https://i.creativecommons.org/l/by-nc-sa/4.0/80x15.png"
    />
  </a>
  <a href="/blog/rss">RSS Feed</a>
</footer>

<style lang="stylus" global>
.content-wrapper
  display flex
  flex-direction column
  max-width 120ch
  margin 0 auto

  main
    flex-basis 120ch
    padding 0.5rem

  aside
    display flex
    flex-direction column
    gap 0.5rem

    width 30ch
    min-width 30ch
    height fit-content
    margin 1rem
    padding 0.5rem

    background var(--bg-light)
    border-radius 0.5rem

  p
    padding 0

footer
  display flex
  justify-content space-between
  align-items center

  padding 1rem
</style>
