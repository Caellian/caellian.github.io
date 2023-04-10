<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<main>
  <h1>Latest posts</h1>

  <ul>
    {#each data.posts.slice(0, 10) as post}
      <li><a href={"/blog/" + post.url}>{post.title}</a></li>
    {/each}
  </ul>
</main>

<a class="hidden" href="/blog/index">Blog index</a>
