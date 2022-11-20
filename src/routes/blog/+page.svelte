<div class="content-wrapper">
  <main>
    <h1>Welcome to my blog!</h1>

    <p>Here I write stuff.</p>
  </main>

  <aside>
    <h2>Latest posts</h2>
    <ul>
      <li>A</li>
      <li>B</li>
      <li>C</li>
    </ul>
    <h2>Common tags</h2>
    <ul>

    </ul>
    <a href="#">RSS</a>
  </aside>
</div>

<style lang="stylus">
.content-wrapper
  display flex
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
</style>
