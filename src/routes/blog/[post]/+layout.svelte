<script lang="ts">
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<main>
  <slot />
</main>

<aside>
  <h2>More posts</h2>
  <ul>
    {#each data.posts as post}
      <li>
        <a href="/blog/{post.slug}">
          {post.title}
        </a>
      </li>
    {/each}
  </ul>
</aside>
