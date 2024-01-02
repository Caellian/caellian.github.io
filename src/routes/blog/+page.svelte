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

  <div class="post-list">
    {#each data.posts as post}
      <a href={`/blog/${post.slug}`} class="post">
        <div class="date center">
          <span>{formatDate(post.update || post.date)}</span>
        </div>
        <div class="details">
          <h3 class="title">
            <a href={`/blog/${post.slug}`}>{post.title}</a>
          </h3>
          <div class="summary">{post.summary}</div>
          {#if post.tags.length > 0}
            <ul class="tags">
              {#each post.tags as tag}
                <li>{tag}</li>
              {/each}
            </ul>
          {/if}
        </div>
      </a>
    {/each}
  </div>
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

    .post
      display flex
      align-items stretch
      gap: 0.5rem
      margin-left: 1ch

      +.post
        margin-top: 1rem
      
      .details
        display flex
        flex-direction column
        gap 0.5rem
        color: var(--fg)

        .title
          padding 0
          font-size 1.25rem

      .date
        grid-row: 1 / span 3
        padding-right 1rem
        border-right 2px solid var(--bg)
        font-family var(--fnt-mono)
        color: var(--fg)
  
  aside
    margin-top: 1rem
    a
      display: flex
      align-items: center

</style>
