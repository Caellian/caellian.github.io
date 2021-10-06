<script lang="ts">
  import { prerendering } from "$app/env";
  import { onMount } from "svelte";

  import { css_vars } from "$lib/css";
  import {
    Direction,
    direction_translate,
    EasingFunction,
    easing_function_css,
    transform_to_css,
  } from "$lib/animation";

  export let duration: number = 600;
  export let direction: Direction = Direction.Up;
  export let delay: number = 0;
  export let easing_function: EasingFunction = EasingFunction.ease_in_out;

  let animator: HTMLDivElement = null;

  let visible = false;

  let content_style = css_vars({
    ea_duration: `${duration}ms`,
    ea_transform: transform_to_css(direction_translate(direction)),
    ea_delay: delay != 0 ? `${delay}ms` : "0s",
    ea_easing: easing_function_css(easing_function),
  });

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      visible = visible || entries[0].isIntersecting;
    });

    observer.observe(animator);

    return () => {
      observer.unobserve(animator);
    };
  });
</script>

{#if prerendering}
  <slot />
{:else}
  <div
    class="animator"
    class:visible
    class:vertical={direction === Direction.Up || direction === Direction.Down}
    bind:this={animator}
  >
    <div class="content" style={content_style}>
      <slot />
    </div>
  </div>
{/if}

<style lang="stylus">
    .animator
        width 100%
        height 100%

        &.vertical
            overflow-y hidden

        .content
            opacity 0

            width 100%
            height 100%

            pointer-events none

            transform var(--ea-transform)

            transition-duration var(--ea-duration)
            transition-property transform, opacity
            transition-delay var(--ea-delay)
            transition-timing-function var(--easing_function)


        &.visible
            .content
                opacity 1
                pointer-events auto
                transform none

</style>
