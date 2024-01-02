<script>
  import Icon from "$components/Icon.svelte";
  import PostList from "$components/PostList.svelte";
  export let data;

  let posts = data.posts;
</script>

<main>
  <h2>Recent Posts</h2>
  <PostList {posts} />
</main>

<aside class="blog-sidebar">
  <a class="atom" href="/atom.xml">
    <Icon size="2rem" name={"rss"}></Icon>
    Atom Feed
  </a>
</aside>
