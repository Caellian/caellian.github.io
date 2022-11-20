<script lang="ts">
  import { page } from "$app/stores";
  import { createEventDispatcher } from "svelte";

  const clickDispatch = createEventDispatcher();

  interface NavLink {
    link: string;
    name: string;
  }

  const links = [
    {
      link: "/",
      name: "About Me",
    },
    {
      link: "/projects",
      name: "Projects",
    },
    // {
    //     link: "/blog",
    //     name: "Blog"
    // },
    {
      link: "/contact",
      name: "Contact",
    },
  ] as NavLink[];

  function on_click(target: string) {
    return () => {
      clickDispatch('click', { target });
    };
  };
</script>

{#each links as l}
  <li class:current={$page.url.pathname === l.link}>
    <a href={l.link} on:click={on_click(l.link)}>{l.name}</a>
  </li>
{/each}
