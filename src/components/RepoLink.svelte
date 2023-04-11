<script lang="ts">
  import Icon from "./Icon.svelte";

  export let link: string;

  function icon() {
    if (link.toLowerCase().includes("github")) {
      return "github";
    } else if (link.toLowerCase().includes("gitlab")) {
      return "gitlab";
    } else if (link.toLowerCase().includes("bitbucket")) {
      return "bitbucket";
    } else {
      return "";
    }
  }

  function label() {
    if (link.toLowerCase().includes("github")) {
      return "GitHub";
    } else if (link.toLowerCase().includes("gitlab")) {
      return "GitLab";
    } else if (link.toLowerCase().includes("bitbucket")) {
      return "BitBucket";
    } else {
      return "Open";
    }
  }
</script>

<a href={link} class="button repo-link">
  <Icon size="2rem" name={icon()} />
  <p>{label()}</p>
</a>

<style lang="stylus">
a.button
  display flex
  align-items center
  --icon-color var(--bg-accent)
  padding 0.25rem 0.5rem
  margin 0.25rem

  p
    padding 0
    padding-left 0.5rem
    font-family 'Quicksand', sans-serif
    font-weight bold

  :global(.svg)
    transition fill ease-in-out 200ms

  &:hover
    --icon-color var(--accent)
</style>
