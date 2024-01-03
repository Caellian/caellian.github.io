<script>
  import Icon from "$components/Icon.svelte";
  import PostList from "$components/PostList.svelte";

  export let data;

  const Topic = data.topic[0].toUpperCase() + data.topic.slice(1);
</script>

<main class="post-list">
  <div class="inline">
    <a href="/blog" class="back button">
      <Icon size="2rem" name="arrow-left" />
    </a>
    <h2>Posts About {Topic}</h2>
  </div>
  {#if data.posts.length === 0}
    <p>No posts found.</p>
  {:else}
    <PostList posts={data.posts} />
  {/if}
</main>

<aside class="blog-sidebar island">
  <a class="atom" href="./{data.topic}/atom.xml">
    <Icon size="2rem" name={"rss"} />
    Atom Feed
  </a>
</aside>

<style lang="stylus">
main>div.inline
  display flex
  align-items baseline
  gap 0.5rem
  margin 0.5rem
  margin-bottom 0.45rem

  h2
    padding 0

a.back.button
  display grid
  justify-items center
  align-items center
  padding initial
  width 3rem
  height 3rem
  border-radius 100vw

  :global(svg)
    transform translateX(-0.1rem)
</style>
