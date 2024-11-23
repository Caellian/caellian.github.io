<script>
  import { onMount } from "svelte";
  import PickerHSL from "./PickerHSL.svelte";
  import Slider from "./Slider.svelte";
  import {
    CS,
    SLIDERS,
    colorCSS,
    convert,
    COLOR,
    COLOR_STORAGE,
    DEFAULT,
  } from "./colors";

  $: colorSpace = $COLOR?.colorSpace || "hsl";
  const models = Object.values(CS).map((it) => it.toUpperCase());

  $: sliders = SLIDERS[colorSpace];

  $: picker = {
    [CS.HSL]: PickerHSL,
  }[colorSpace];

  function setColorSpace(to_cs) {
    COLOR.update((c) => convert(colorSpace, to_cs)(c));
  }
  function setColor(value) {
    if (colorSpace !== value.colorSpace) {
      setColorSpace(value.colorSpace);
    }
    COLOR.set(value);
  }

  function isTabSelected(i) {
    return colorSpace == Object.values(CS)[i];
  }

  function selectTab(i) {
    return () => {
      setColorSpace(Object.values(CS)[i]);
    };
  }

  onMount(() => {
    COLOR.update((it) => {
      console.log("a");
      if (it != null) {
        return it;
      }

      console.log("b");
      let stored = window.localStorage.getItem(COLOR_STORAGE);
      try {
        stored = JSON.parse(stored);
      } catch (e) {
        stored = null;
      }
      if (stored == null) {
        return DEFAULT[CS.HSL];
      }

      return JSON.parse(stored);
    });
  });
</script>

<main class="color-picker">
  {#if picker}
    <svelte:component this={picker} color={$COLOR} {setColor} />
  {:else}
    <div class="preview" style="background-color: {colorCSS($COLOR)}"></div>
  {/if}
  <div class="controls">
    <p>{JSON.stringify($COLOR)}</p>
    <div class="tabs" role="tablist">
      {#each models as model, i}
        {#if i > 0}
          <span>/</span>
        {/if}
        <div
          role="tab"
          aria-selected={isTabSelected(i)}
          on:click={selectTab(i)}
          on:keypress={() => {}}
          tabindex="0"
        >
          <p class="as-link">{model}</p>
        </div>
      {/each}
    </div>
    {#if $COLOR}
      {#each Object.entries(sliders.controls) as [i, s] (i)}
        <Slider
          {...s}
          part={i}
          color={$COLOR}
          setProperty={(value) => ($COLOR[i] = value)}
        />
      {/each}
    {/if}
  </div>
</main>

<aside>
  <div class="tabs" role="tablist">
    <p class="as-link" role="tab" on:click={selectTab(0)}>Formats</p>
    <span>/</span>
    <p class="as-link" role="tab" on:click={selectTab(1)}>
      Complementary Colors
    </p>
  </div>
</aside>

<div></div>

<style lang="stylus">
main.color-picker
    display: flex;
    align-items: center
    gap: 0.5rem;
    margin: auto;
    width: @css{min(90vw, 100ch)};
    height: 100%;

    .preview
        min-width: 20rem
        min-height: 20rem
        margin: 1rem
        border-radius: 1rem

        &::before
          position: absolute
          content: ""
          height: 1ch
          width: 20ch
          border-radius: 0.5rem
          margin: 0.7ch
          background: #fff7
          
          z-index: 2

    .controls
        flex-grow: 1;
        display: flex;
        flex-direction: column;

        background-color: var(--bg-accent)
        border-radius: 1rem;
        padding: 1rem;

.tabs
  display: flex
  gap: 0.2rem

  *
    width: max-content

aside .tabs
  *
    font-size: 1.4rem

</style>
