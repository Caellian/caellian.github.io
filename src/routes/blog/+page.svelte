<script>
  import Icon from "$components/Icon.svelte";
  import PostList from "$components/PostList.svelte";
  import TagList from "$components/TagList.svelte";
  import { orderPosts } from "$lib/posts";

  export let data;

  $: posts = orderPosts(data.posts);
</script>

<main class="post-list">
  <h2>Recent Posts</h2>
  <PostList {posts} />
</main>

<aside class="blog-sidebar island">
  <a class="atom" href="/atom.xml">
    <Icon size="2rem" name={"rss"}></Icon>
    Atom Feed (All)
  </a>
  <hr />
  <h4>Topics</h4>
  <ul class="topics">
    {#each data.topics as topic}
      <li>
        <a href="/blog/topic/{topic}" aria-label="posts from {topic} topic">
          {topic}
        </a>
        <a href="/blog/topic/{topic}/atom.xml" aria-label="rss" class="tag">
          <Icon size="1rem" name={"rss"} /> Atom
        </a>
      </li>
    {/each}
  </ul>

  <h4>Tags</h4>
  <TagList tags={data.tags} />
</aside>

<style lang="stylus">
h2
  margin-left 0.5rem

.topics
  li
    display flex
    gap 0.5rem

    &:before
      content ">"
      color var(--fg-muted)

.blog-sidebar
  :global(.tags>*)
    flex-grow 1

</style>
