<script context="module">
  /**
   * @typedef {Object} Entry
   * @prop {string} name
   * @prop {string} icon
   * @prop {string} url
   *
   * @typedef {Object<string, Entry[]>} Data
   */
</script>

<script>
  import { browser } from "$app/environment";
  import Icon from "./Icon.svelte";
  import LINKS from "$data/social.json";

  /**
   * @type {Data}
   */
  export const data = new Map(Object.entries(LINKS));
</script>

<ul
  class="links"
>
  {#each [...data.keys()] as name}
    <li class="bracket">
      <p>{name}</p>
      <ul class="icons">
        {#each data.get(name) || [] as link}
          <li class="link">
            <a href={link.url} target="_blank" rel="noreferrer">
              {#if !browser}
                {link.name}
              {:else}
                <Icon size="2rem" name={link.icon} />
                <p>{link.name}</p>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>

<style>
.links {
  display: flex;
  gap: 2rem;
}

.bracket .icons {
  position: relative;
  display: flex;
  gap: 1rem;

  --bracket-height: 0.5em;
  margin-top: calc(var(--bracket-height) + 0.2rem);
}

.bracket .icons::before {
  display: block;
  content: "";
  position: absolute;

  width: 100%;
  margin-top: calc((var(--bracket-height) + 0.2rem) * -1);
  height: var(--bracket-height);
  border: 1pt solid var(--bg-accent);
  border-bottom: none;
}

li.link {
  color: var(--fg-hint);
  --icon-color: currentColor;

  & a,
  p {
    color: currentColor;
  }
}

li.link:hover {
  color: var(--accent-4)
}
li.link:active {
  color: var(--accent-3)
}

@media screen and (width <= 600px) {
  .bracket .icons {
    flex-direction: column;
  }
}
</style>
