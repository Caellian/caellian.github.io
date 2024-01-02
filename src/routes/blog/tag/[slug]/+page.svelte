<script>
  import Icon from "$components/Icon.svelte";
  import PostList from "$components/PostList.svelte";

  export let data;
</script>

<a href="/blog" class="back">
  <Icon size="2rem" name="arrow-left" />
  All Posts
</a>

<main>
  <h2>Posts About {data.tag}</h2>
  {#if data.posts.length === 0}
    <p>No posts found.</p>
  {:else}
    <PostList posts={data.posts} />
  {/if}
</main>

<aside class="blog-sidebar">
  <a class="atom" href="/atom.xml">
    <Icon size="2rem" name={"rss"}></Icon>
    Atom Feed
  </a>
</aside>

<style lang="stylus">
a.back
  display flex
  align-items center
</style>
