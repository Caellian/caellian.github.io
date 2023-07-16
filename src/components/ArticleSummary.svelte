<script lang="ts">
  import { type PostInfo } from "$lib/blog";
  import { PUBLIC_BUILD_BLOG as include_links } from "$env/static/public";

  export let article: PostInfo;
</script>

<a rel={include_links ? "external" : undefined} href={"/blog/" + article.url}
  >{article.title}</a
>
