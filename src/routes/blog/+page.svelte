<script>
  import Icon from "$components/Icon.svelte";
  export let data;

  function formatDate(date) {
    let d = new Date(date);
    return d.toISOString().slice(0, 10);
  }
</script>

<main>
  <h2>Recent Posts</h2>

  <ul class="post-list">
    {#each data.posts as post}
      <li>
        <a href={`blog/${post.slug}`}>{post.title}</a> -- {formatDate(
          post.update || post.date
        )}
      </li>
    {/each}
  </ul>
</main>

<aside>
  <a class="atom" href="/atom.xml">
    <Icon size="2rem" name={"rss"}></Icon>
    Atom Feed
  </a>
</aside>

<style lang="stylus">

  .post-list
    background-color: var(--bg-light)
    border: 2px solid var(--bg-accent)
    padding: 1rem
    border-radius: 1rem

    li
      list-style: "> "
      margin-left: 1ch
  
  aside
    margin-top: 1rem
    a
      display: flex
      align-items: center

</style>
