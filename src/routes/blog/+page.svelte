<script>
  import Icon from "$components/Icon.svelte";
  import PostList from "$components/PostList.svelte";
  import TagList from "$components/TagList.svelte";
  import { orderPosts } from "$lib/posts";

  /**
   * @type {{
   *   posts: import("$lib/posts").PostData[],
   *   topics: string[],
   *   keywords: string[],
   * }}
   */
  export let data;

  $: posts = data.posts;
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
        <a href="/blog/topic/{topic}/atom.xml" aria-label="rss" class="tag button">
          <Icon size="1rem" name={"rss"} /> Atom
        </a>
      </li>
    {/each}
  </ul>

  <h4>Tags</h4>
  <TagList keywords={data.keywords} />
  <hr/>
  <ul class="references">
    <li><a href="/blog/index">index</a></li>
  </ul>
</aside>

<style lang="stylus">
h2
  margin-left 0.5rem

.topics
  li
    display flex
    gap 0.5rem
    margin-bottom 0.2rem

    &:before
      content ">"
      color var(--fg-muted)
    
    .tag.button
      height min-content
      align-self center
      margin-left auto

.blog-sidebar
  hr
    margin 1rem
  .references
    display flex
    flex-wrap wrap
    font-size 0.5rem
    font-family var(--fnt-mono)

    gap 0.2rem

    li + li::before
      display inline-block
      content: "|"
      color var(--accent-8)
      float left
      margin-right 0.2rem
  :global(.tags>*)
    flex-grow 1

</style>
