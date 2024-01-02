<div id="blog-layout">
  <slot />
</div>

<style lang="stylus">
    #blog-layout
        width: @css { clamp(30ch, 90vw, 80ch) }
        margin: 1rem auto
</style>
