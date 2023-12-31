<script>
  export var name;
  export var description;
  export var link;
</script>

<a href={link || "."}>
  <h3>{name}</h3>
  <p>{description}</p>
</a>

<style lang="stylus">
a
  display block

  background-color var(--bg)
  padding 1rem 2.5rem

  height min-content
  border-bottom solid 0.15rem var(--bg-accent)
  border-top solid 0.15rem var(--bg-accent)

  transition background-color ease-in-out transition-medium
  transition border-color ease-in-out transition-short

  h3
    font-family 'Quicksand', sans-serif
    font-size 1.4rem
    color var(--fg)

    padding 0

  p
    font-size 1rem
    padding 0

  &:hover
    background-color var(--bg-accent)

    border-color var(--accent)

    h3
      color var(--accent-7)

  &:active
    h3
      color var(--accent)

    p
      color var(--accent-7)
</style>
